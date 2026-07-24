import { Validator, Sanitizer, globalRateLimiter } from '@/lib/utils/validation'
import { siteConfig } from '@/lib/config'

type HeaderValue = string | number | readonly string[]
type HeaderMap = Record<string, string | undefined>
type NextFunction = () => unknown

interface SecurityRequest {
  headers: HeaderMap
  connection?: {
    remoteAddress?: string
  }
  socket?: {
    remoteAddress?: string
  }
  url?: string
  method?: string
  body?: unknown
  query?: ValidationObject
  params?: ValidationObject
}

interface SecurityResponse {
  statusCode: number
  status(code: number): SecurityResponse
  json: (this: SecurityResponse, data: unknown) => unknown
  setHeader(name: string, value: HeaderValue): void
  removeHeader(name: string): void
  end: (this: SecurityResponse, ...args: unknown[]) => unknown
}

type Middleware = (
  req: SecurityRequest,
  res: SecurityResponse,
  next: NextFunction
) => unknown

interface RateLimitOptions {
  limit?: number
  windowMs?: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface CorsOptions {
  origin?: HeaderValue
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

type ValidationType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'email'
  | 'url'
  | 'slug'
  | 'notionId'

interface ValidationRule {
  required?: boolean
  type?: ValidationType
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: unknown) => true | string
  sanitize?: boolean
}

type ValidationObject = Record<string, unknown>
type ValidationSchemaSection = Record<string, ValidationRule>

interface ValidationSchema {
  body?: ValidationSchemaSection
  query?: ValidationSchemaSection
  params?: ValidationSchemaSection
}

interface SecurityMiddlewareOptions {
  rateLimit?: false | RateLimitOptions
  cors?: false | CorsOptions
  securityHeaders?: false
  requestLog?: false
}

export function getClientIp(req: SecurityRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const remoteAddress =
    req.connection?.remoteAddress || req.socket?.remoteAddress

  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }

  if (realIp) {
    return realIp
  }

  return remoteAddress || 'unknown'
}

export function rateLimitMiddleware(options: RateLimitOptions = {}): Middleware {
  const {
    limit = 100,
    windowMs = 60000,
    message = 'Too many requests',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options

  return (req, res, next) => {
    const ip = getClientIp(req)
    const identifier = `${ip}:${req.url}`

    if (globalRateLimiter.isRateLimited(identifier, limit, windowMs)) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      })
    }

    const originalJson = res.json
    res.json = function (this: SecurityResponse, data: unknown) {
      const statusCode = res.statusCode

      if (
        (skipSuccessfulRequests && statusCode < 400) ||
        (skipFailedRequests && statusCode >= 400)
      ) {
        const userRequests =
          globalRateLimiter.requests.get(identifier) || []
        if (userRequests.length > 0) {
          userRequests.pop()
        }
      }

      return originalJson.call(this, data)
    }

    next()
    return undefined
  }
}

export function validateInputMiddleware(
  schema: ValidationSchema
): Middleware {
  return (req, res, next) => {
    const errors: string[] = []

    if (schema.body) {
      const bodyErrors = validateObject(
        req.body as ValidationObject,
        schema.body,
        'body'
      )
      errors.push(...bodyErrors)
    }

    if (schema.query) {
      const queryErrors = validateObject(req.query, schema.query, 'query')
      errors.push(...queryErrors)
    }

    if (schema.params) {
      const paramsErrors = validateObject(req.params, schema.params, 'params')
      errors.push(...paramsErrors)
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      })
    }

    next()
    return undefined
  }
}

function validateObject(
  obj: ValidationObject | undefined,
  schema: ValidationSchemaSection,
  prefix: string
): string[] {
  const errors: string[] = []

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj?.[key]
    const fieldPath = `${prefix}.${key}`

    if (
      rules.required &&
      (value === undefined || value === null || value === '')
    ) {
      errors.push(`${fieldPath} is required`)
      continue
    }

    if (value === undefined || value === null) {
      continue
    }

    if (rules.type) {
      if (!validateType(value, rules.type)) {
        errors.push(`${fieldPath} must be of type ${rules.type}`)
        continue
      }
    }

    if (rules.minLength !== undefined || rules.maxLength !== undefined) {
      if (
        !Validator.isValidLength(
          value as string,
          rules.minLength,
          rules.maxLength
        )
      ) {
        errors.push(
          `${fieldPath} length must be between ${
            rules.minLength || 0
          } and ${rules.maxLength || 'unlimited'}`
        )
      }
    }

    if (rules.min !== undefined || rules.max !== undefined) {
      if (!Validator.isValidNumber(value as number, rules.min, rules.max)) {
        errors.push(
          `${fieldPath} must be between ${rules.min || '-∞'} and ${
            rules.max || '∞'
          }`
        )
      }
    }

    if (rules.pattern) {
      if (typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${fieldPath} format is invalid`)
      }
    }

    if (rules.validator) {
      const result = rules.validator(value)
      if (result !== true) {
        errors.push(`${fieldPath}: ${result}`)
      }
    }

    if (rules.sanitize && typeof value === 'string' && obj) {
      obj[key] = Sanitizer.sanitizeXss(value)
    }
  }

  return errors
}

function validateType(value: unknown, type: ValidationType): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'email':
      return Validator.isValidEmail(value as string)
    case 'url':
      return Validator.isValidUrl(value as string)
    case 'slug':
      return Validator.isValidSlug(value as string)
    case 'notionId':
      return Validator.isValidNotionId(value as string)
    default:
      return true
  }
}

export function corsMiddleware(options: CorsOptions = {}): Middleware {
  const {
    origin = siteConfig('LINK') as HeaderValue,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false,
    maxAge = 86400
  } = options

  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '))
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '))
    res.setHeader('Access-Control-Allow-Credentials', credentials.toString())
    res.setHeader('Access-Control-Max-Age', maxAge.toString())

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    next()
    return undefined
  }
}

export function securityHeadersMiddleware(): Middleware {
  return (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-DNS-Prefetch-Control', 'off')
    res.setHeader('X-Download-Options', 'noopen')
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')

    res.removeHeader('X-Powered-By')
    res.removeHeader('Server')

    next()
    return undefined
  }
}

export function requestLogMiddleware(): Middleware {
  return (req, res, next) => {
    const start = Date.now()
    const ip = getClientIp(req)
    const userAgent = req.headers['user-agent'] || 'unknown'

    const originalEnd = res.end
    res.end = function (this: SecurityResponse, ...args: unknown[]) {
      const duration = Date.now() - start
      const statusCode = res.statusCode

      console.log(
        `[${new Date().toISOString()}] ${req.method} ${
          req.url
        } ${statusCode} ${duration}ms - ${ip} - ${userAgent}`
      )

      if (statusCode >= 400) {
        console.error(
          `[ERROR] ${req.method} ${req.url} - ${statusCode} - IP: ${ip}`
        )
        if (req.body && Object.keys(req.body as object).length > 0) {
          console.error('Request body:', JSON.stringify(req.body, null, 2))
        }
      }

      return originalEnd.apply(this, args)
    }

    next()
    return undefined
  }
}

export function securityMiddleware(
  options: SecurityMiddlewareOptions = {}
): Middleware {
  const middlewares: Middleware[] = []

  if (options.rateLimit !== false) {
    middlewares.push(rateLimitMiddleware(options.rateLimit))
  }

  if (options.cors !== false) {
    middlewares.push(corsMiddleware(options.cors))
  }

  if (options.securityHeaders !== false) {
    middlewares.push(securityHeadersMiddleware())
  }

  if (options.requestLog !== false) {
    middlewares.push(requestLogMiddleware())
  }

  return (req, res, next) => {
    let index = 0

    function runNext(): unknown {
      if (index >= middlewares.length) {
        return next()
      }

      const middleware = middlewares[index++]!
      middleware(req, res, runNext)
      return undefined
    }

    runNext()
  }
}

export default {
  rateLimitMiddleware,
  validateInputMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  requestLogMiddleware,
  securityMiddleware,
  getClientIp
}
