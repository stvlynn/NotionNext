/**
 * Whether the current build targets static export instead of ISR.
 */
export function isExport(): boolean {
  return process.env.EXPORT === 'true'
}
