import {
  cleanPostSummaries as cleanPostSummariesRaw,
  fetchGlobalAllData as fetchGlobalAllDataRaw,
  getPostBlocks as getPostBlocksRaw,
  resolvePostProps as resolvePostPropsRaw
} from '@/lib/db/SiteDataApi'

/**
 * Server-only compatibility adapter for the transitional page DTOs.
 * Keep this module scoped to SiteDataApi so client-safe helpers never pull in
 * the backend cache graph.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const cleanPostSummaries = cleanPostSummariesRaw as any
export const fetchGlobalAllData = fetchGlobalAllDataRaw as any
export const getPostBlocks = getPostBlocksRaw as any
export const resolvePostProps = resolvePostPropsRaw as any
/* eslint-enable @typescript-eslint/no-explicit-any */
