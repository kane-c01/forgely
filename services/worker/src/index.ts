/**
 * @forgely/worker — entry point.
 *
 * Sprint-0 stub kept Worker as a placeholder; T17 wires the end-to-end
 * `runPipeline` so any BullMQ Job that fans in here can take a
 * ScrapedData payload all the way to a deployed Cloudflare Pages site.
 *
 * Production wires this into BullMQ:
 *   import { Worker } from 'bullmq'
 *   import { runPipeline } from '@forgely/worker'
 *   new Worker('forgely-generation', async (job) => runPipeline(job.data, hooks))
 */
export { runPipeline, type PipelineInput, type PipelineResult, type PipelineStep, type PipelineHooks } from './pipeline'
