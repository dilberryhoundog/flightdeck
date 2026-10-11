// The band's state contract: what register.js keeps in $.state under flight-band.band.
export type BandLatest = { workshop: string; label: string | null }

export type BandSummary = {
  active: number
  settled: number
  captured: number
  openQuestions: number
  heldForLater: number
  latest: BandLatest | null
  warnings: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'flight-band': { band: BandSummary | null }
  }
}
