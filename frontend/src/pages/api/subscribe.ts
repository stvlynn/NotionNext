import type { NextApiRequest, NextApiResponse } from 'next'
import subscribeToMailchimpApi from '@/lib/plugins/mailchimp'

type SubscribeResponse = {
  status: 'success' | 'error'
  message: string
}

/**
 * Handle email subscriptions.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubscribeResponse>
) {
  if (req.method === 'POST') {
    const { email, firstName, lastName } = req.body
    try {
      const response = await subscribeToMailchimpApi({
        email,
        first_name: firstName,
        last_name: lastName
      })
      await response.json()
      res.status(200).json({ status: 'success', message: 'Subscription successful!' })
    } catch (error) {
      console.error('Subscription error:', error)
      res.status(400).json({ status: 'error', message: 'Subscription failed!' })
    }
  } else {
    res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }
}
