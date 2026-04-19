/**
 * Vision client used by `GenericAIAdapter` to bootstrap selectors from a
 * screenshot + HTML sample of an unknown e-commerce site.
 *
 * The default Forgely implementation will wrap Anthropic Claude Vision; here
 * we expose only the interface so adapters stay test-friendly and the AI
 * package owns the heavy SDK dependency.
 */
export interface VisionAnalyzeInput {
  imageBytes: Uint8Array
  imageMimeType: 'image/png' | 'image/jpeg' | 'image/webp'
  htmlSample: string
  url: string
}

export interface VisionAnalysisResult {
  isEcommerce: boolean
  /** 0..1 confidence in the classification. */
  confidence: number
  selectors: SelectorBundle
  storeMeta?: {
    name?: string
    currency?: string
    language?: string
  }
}

export interface SelectorBundle {
  /** CSS selector matching the product list container (parent element). */
  productList?: string
  /** CSS selector matching individual product cards (relative to root, not list). */
  productCard: string
  title?: string
  price?: string
  image?: string
  link?: string
  description?: string
}

export interface VisionClient {
  analyzeEcommercePage(input: VisionAnalyzeInput): Promise<VisionAnalysisResult>
}
