// pages/sitemap.xml.js
import axios from 'axios'
import type { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Slug from '../[prefix]'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { PageProps } from '@/lib/page/runtime'

/**
 * Redirect the Notion OAuth callback to the auth result page.
 */
const UI: NextPage<PageProps> = props => {
  const { redirect_pathname, redirect_query } = props
  const router = useRouter()
  useEffect(() => {
    router?.push({ pathname: redirect_pathname, query: redirect_query })
  }, [redirect_pathname, redirect_query, router])
  return <Slug {...props} />
}

/**
 * Handle OAuth callback query params on the server.
 */
export const getServerSideProps: GetServerSideProps<PageProps> = async ctx => {
  const from = `auth`
  const props = await fetchGlobalAllData({ from })
  delete props.allPages
  const code = Array.isArray(ctx.query.code) ? ctx.query.code[0] : ctx.query.code

  let params: { status: number; statusText: string } | null = null
  if (code) {
    params = await fetchToken(code)
  }

  if (params?.status === 200) {
    props.redirect_query = {
      msg: 'oauth_success'
    }
  } else if (!params) {
    props.redirect_query = { msg: 'oauth_invalid_request' }
  } else {
    props.redirect_query = { msg: 'oauth_failed' }
  }

  props.redirect_pathname = '/auth/result'

  return {
    props
  }
}

const fetchToken = async (code: string) => {
  if (!code) {
    return { status: 400, statusText: 'Invalid request' }
  }
  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET
  const redirectUri = process.env.OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return { status: 503, statusText: 'OAuth is not configured' }
  }

  // encode in base 64
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const response = await axios.post(
      'https://api.notion.com/v1/oauth/token',
      {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encoded}`
        }
      }
    )

    return {
      status: response.status,
      statusText: response.statusText
    }
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    console.error('Notion OAuth token exchange failed', {
      status
    })
    return {
      status: status || 500,
      statusText: 'OAuth token exchange failed'
    }
  }
}

export default UI
