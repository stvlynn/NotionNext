import { Validator } from '@/lib/utils/validation'

type EnvRuleType = 'boolean' | 'number' | 'string'
type EnvRuntimeValue = string | undefined

interface EnvValidationRule {
  type?: EnvRuleType
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  description?: string
  enum?: readonly string[]
  default?: string | boolean
  validator?: (value: string) => true | string
}

interface EnvValidationRules {
  required: Record<string, EnvValidationRule>
  recommended: Record<string, EnvValidationRule>
  security: Record<string, EnvValidationRule>
  services: Record<string, EnvValidationRule>
  development: Record<string, EnvValidationRule>
}

export interface EnvironmentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

interface EnvVarValidationResult {
  valid?: true
  error?: string
}

const ENV_VALIDATION_RULES: EnvValidationRules = {
  required: {
    NOTION_PAGE_ID: {
      validator: value => {
        if (!value) return 'NOTION_PAGE_ID is required'
        const ids = value.split(',')
        for (const id of ids) {
          const cleanId = id.trim().split(':')[1] || id.trim()
          if (!Validator.isValidNotionId(cleanId)) {
            return `Invalid Notion ID format: ${cleanId}`
          }
        }
        return true
      }
    }
  },

  recommended: {
    NEXT_PUBLIC_TITLE: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    NEXT_PUBLIC_DESCRIPTION: {
      type: 'string',
      minLength: 1,
      maxLength: 500
    },
    NEXT_PUBLIC_AUTHOR: {
      type: 'string',
      minLength: 1,
      maxLength: 50
    },
    NEXT_PUBLIC_LINK: {
      validator: value => {
        if (value && !Validator.isValidUrl(value)) {
          return 'NEXT_PUBLIC_LINK must be a valid URL'
        }
        return true
      }
    }
  },

  security: {
    REDIS_URL: {
      validator: value => {
        if (
          value &&
          !value.startsWith('redis://') &&
          !value.startsWith('rediss://')
        ) {
          return 'REDIS_URL must start with redis:// or rediss://'
        }
        return true
      }
    },
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
      validator: value => {
        if (value && !value.startsWith('pk_')) {
          return 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_'
        }
        return true
      }
    },
    CLERK_SECRET_KEY: {
      validator: value => {
        if (value && !value.startsWith('sk_')) {
          return 'CLERK_SECRET_KEY must start with sk_'
        }
        return true
      }
    }
  },

  services: {
    NEXT_PUBLIC_ANALYTICS_GOOGLE_ID: {
      pattern: /^G-[A-Z0-9]+$/,
      description: 'Google Analytics ID format: G-XXXXXXXXXX'
    },
    NEXT_PUBLIC_ANALYTICS_BAIDU_ID: {
      pattern: /^[a-f0-9]{32}$/,
      description: 'Baidu Analytics ID should be 32 character hex string'
    },
    ALGOLIA_ADMIN_APP_KEY: {
      minLength: 32,
      maxLength: 32,
      description: 'Algolia Admin API Key should be 32 characters'
    },
    NEXT_PUBLIC_ALGOLIA_APP_ID: {
      pattern: /^[A-Z0-9]{10}$/,
      description: 'Algolia App ID format: 10 uppercase alphanumeric characters'
    }
  },

  development: {
    NODE_ENV: {
      enum: ['development', 'production', 'test'],
      default: 'development'
    },
    NEXT_PUBLIC_DEBUG: {
      type: 'boolean',
      default: false
    }
  }
}

export function validateEnvironmentVariables(): EnvironmentValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.required)) {
    const value = process.env[key]
    const result = validateEnvVar(key, value, rules, true)

    if (result.error) {
      errors.push(result.error)
    }
  }

  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.recommended)) {
    const value = process.env[key]
    const result = validateEnvVar(key, value, rules, false)

    if (result.error) {
      warnings.push(result.error)
    } else if (!value) {
      warnings.push(`Recommended environment variable ${key} is not set`)
    }
  }

  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.security)) {
    const value = process.env[key]
    const result = validateEnvVar(key, value, rules, false)

    if (result.error) {
      errors.push(result.error)
    }
  }

  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.services)) {
    const value = process.env[key]
    const result = validateEnvVar(key, value, rules, false)

    if (result.error) {
      warnings.push(result.error)
    }
  }

  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.development)) {
    const value = (process.env[key] || rules.default) as EnvRuntimeValue
    const result = validateEnvVar(key, value, rules, false)

    if (result.error) {
      warnings.push(result.error)
    }
  }

  const sensitivePatterns = [
    { pattern: /sk_[a-zA-Z0-9]+/, name: 'Secret Key' },
    { pattern: /[a-f0-9]{32,}/, name: 'API Key' },
    { pattern: /password|secret|key/i, name: 'Sensitive Data' }
  ]

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      for (const { pattern, name } of sensitivePatterns) {
        if (value !== undefined && pattern.test(value)) {
          warnings.push(
            `Potential ${name} exposed in public environment variable: ${key}`
          )
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info
  }
}

function validateEnvVar(
  key: string,
  value: EnvRuntimeValue,
  rules: EnvValidationRule,
  required = false
): EnvVarValidationResult {
  if (required && (!value || value.trim() === '')) {
    return { error: `Required environment variable ${key} is not set` }
  }

  if (!value) {
    return { valid: true }
  }

  if (rules.type) {
    switch (rules.type) {
      case 'boolean':
        if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
          return { error: `${key} must be a boolean value (true/false)` }
        }
        break
      case 'number':
        if (isNaN(Number(value))) {
          return { error: `${key} must be a number` }
        }
        break
      case 'string':
        if (typeof value !== 'string') {
          return { error: `${key} must be a string` }
        }
        break
    }
  }

  if (rules.minLength !== undefined && value.length < rules.minLength) {
    return {
      error: `${key} must be at least ${rules.minLength} characters long`
    }
  }

  if (rules.maxLength !== undefined && value.length > rules.maxLength) {
    return {
      error: `${key} must be no more than ${rules.maxLength} characters long`
    }
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    const description = rules.description || 'Invalid format'
    return { error: `${key}: ${description}` }
  }

  if (rules.enum && !rules.enum.includes(value)) {
    return { error: `${key} must be one of: ${rules.enum.join(', ')}` }
  }

  if (rules.validator) {
    const result = rules.validator(value)
    if (result !== true) {
      return { error: `${key}: ${result}` }
    }
  }

  return { valid: true }
}

export function generateEnvDocumentation(): string {
  let doc = '# 环境变量配置文档\n\n'

  doc += '## 必需的环境变量\n\n'
  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.required)) {
    doc += `### ${key}\n`
    doc += `- **必需**: 是\n`
    if (rules.description) doc += `- **说明**: ${rules.description}\n`
    doc += '\n'
  }

  doc += '## 推荐的环境变量\n\n'
  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.recommended)) {
    doc += `### ${key}\n`
    doc += `- **必需**: 否\n`
    if (rules.description) doc += `- **说明**: ${rules.description}\n`
    if (rules.type) doc += `- **类型**: ${rules.type}\n`
    if (rules.minLength) doc += `- **最小长度**: ${rules.minLength}\n`
    if (rules.maxLength) doc += `- **最大长度**: ${rules.maxLength}\n`
    doc += '\n'
  }

  doc += '## 安全相关环境变量\n\n'
  for (const [key, rules] of Object.entries(ENV_VALIDATION_RULES.security)) {
    doc += `### ${key}\n`
    doc += `- **必需**: 否\n`
    doc += `- **类型**: 安全敏感\n`
    if (rules.description) doc += `- **说明**: ${rules.description}\n`
    doc += '\n'
  }

  return doc
}

export function validateOnStartup(): EnvironmentValidationResult {
  const result = validateEnvironmentVariables()

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:')
    result.errors.forEach(error => console.error(`  - ${error}`))

    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:')
    result.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  if (result.errors.length === 0) {
    console.log('✅ Environment validation passed')
  }

  return result
}

export default {
  validateEnvironmentVariables,
  validateOnStartup,
  generateEnvDocumentation
}
