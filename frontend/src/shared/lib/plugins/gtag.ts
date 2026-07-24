// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
type Gtag = (...args: unknown[]) => void

const getGtag = (): Gtag | undefined =>
  (window as unknown as { gtag?: Gtag }).gtag

export const pageview = (url: string, ANALYTICS_GOOGLE_ID: string): void => {
  const gtag = getGtag()
  if (gtag === undefined) { return }
  gtag('config', ANALYTICS_GOOGLE_ID, {
    page_path: url
  })
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value
}: {
  action: string
  category?: string
  label?: string
  value?: string | number
}): void => {
  const gtag = getGtag()
  if (gtag === undefined) { return }
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  })
}
