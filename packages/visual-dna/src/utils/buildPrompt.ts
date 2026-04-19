import { visualDNAById } from '../presets'
import type { DnaId, VisualDNA } from '../types'

export interface PromptFragments {
  /** Comma-separated style keywords ready to drop into a Kling prompt. */
  style: string
  /** Comma-separated negative keywords. */
  negative: string
  /** Free-form technical specs (camera, lens, lighting). */
  technical: string
  /** Pre-baked color grade summary. */
  grade: string
  /** Camera language summary. */
  camera: string
}

/**
 * Build the DNA-derived fragments that get spliced into Kling / Flux
 * prompts. The Director Agent owns the higher-level template; this
 * module just produces the deterministic, DNA-locked pieces.
 */
export function buildPromptFragments(input: DnaId | VisualDNA): PromptFragments {
  const dna = typeof input === 'string' ? visualDNAById[input] : input
  if (!dna) {
    throw new Error(`Unknown Visual DNA id: ${String(input)}`)
  }
  const grade = `${dna.colorGrade.temperature} temperature, ${dna.colorGrade.saturation} saturation, ${dna.colorGrade.contrast} contrast (${dna.colorGrade.overallMood.join(', ')})`
  const camera = `${dna.cameraLanguage.style} ${dna.cameraLanguage.pace} camera at ${dna.cameraLanguage.perspective.replace('_', ' ')}, ~${dna.cameraLanguage.avgShotDuration}s shots`
  return {
    style: dna.promptBuilder.styleKeywords.join(', '),
    negative: dna.promptBuilder.negativeKeywords.join(', '),
    technical: dna.promptBuilder.technicalSpecs,
    grade,
    camera,
  }
}

/**
 * Render the canonical "DNA suffix" appended to every Kling prompt so
 * that art direction stays locked across all clips for a given site.
 */
export function buildPromptSuffix(input: DnaId | VisualDNA): string {
  const f = buildPromptFragments(input)
  return [
    f.style,
    `lighting: ${(typeof input === 'string' ? visualDNAById[input] : input).lighting.source.replace('_', ' ')}`,
    `color grade: ${f.grade}`,
    `camera: ${f.camera}`,
    `technical: ${f.technical}`,
    `do not include: ${f.negative}`,
  ].join('. ')
}
