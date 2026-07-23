/**
 * CJS bridge for next.config.js — Node cannot require the TypeScript module.
 * Keep in sync with buildMode.ts.
 */
function isExport() {
  return process.env.EXPORT === 'true'
}

module.exports = {
  isExport
}
