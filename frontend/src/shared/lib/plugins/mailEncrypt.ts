import type { RefObject } from 'react'

export const handleEmailClick = (
  e: { preventDefault: () => void },
  emailIcon: RefObject<HTMLAnchorElement>,
  CONTACT_EMAIL = ''
): void => {
  if (CONTACT_EMAIL && emailIcon.current && !emailIcon.current.href) {
    e.preventDefault()
    const email = decryptEmail(CONTACT_EMAIL)
    emailIcon.current.href = `mailto:${email}`
    emailIcon.current.click()
  }
}

export const encryptEmail = (email: string): string => {
  return btoa(unescape(encodeURIComponent(email)))
}

export const decryptEmail = (encryptedEmail: string): string => {
  try {
    return decodeURIComponent(escape(atob(encryptedEmail)))
  } catch (error) {
    console.error('解密邮箱失败:', error)
    return encryptedEmail
  }
}

/** 将配置中的 CONTACT_EMAIL（可能为 base64 密文）解析为可显示的明文 */
export const resolveContactEmail = (raw: unknown): string => {
  if (!raw || typeof raw !== 'string') {
    return ''
  }
  if (raw.includes('@')) {
    return raw
  }
  return decryptEmail(raw)
}
