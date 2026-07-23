export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  wait = 100
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, wait)
  }
}
