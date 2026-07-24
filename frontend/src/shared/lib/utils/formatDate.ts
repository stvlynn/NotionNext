import BLOG from '@/blog.config'

type DateInput = string | number | Date | null | undefined

/**
 * 格式化日期
 * @param date
 * @param local
 * @returns {string}
 */
export default function formatDate(date: DateInput, local = BLOG.LANG): string {
  if (!date || !local) return date ? String(date) : ''
  const d = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  const res = d.toLocaleDateString(local, options)
  // 如果格式是中文日期，则转为横杆
  const format =
    local.slice(0, 2).toLowerCase() === 'zh'
      ? res.replace('年', '-').replace('月', '-').replace('日', '')
      : res
  return format
}

/**
 * 时间戳格式化
 * @param {*} timestamp
 * @param {*} fmt
 * @returns
 */
export function formatDateFmt(
  timestamp: string | number | Date,
  fmt: string
): string {
  const date = new Date(timestamp)
  const o: Record<string, number> = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + '').substr(4 - RegExp.$1.length)
    )
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? String(o[k]) : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return fmt.trim()
}
