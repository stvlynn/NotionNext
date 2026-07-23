import type { NextPageContext } from 'next'

interface ErrorPageProps {
  statusCode: number
}

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return <div>发生错误，状态码：{statusCode || 404}</div>
}
ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  const statusCode = res ? res.statusCode : err?.statusCode || 404
  return { statusCode }
}