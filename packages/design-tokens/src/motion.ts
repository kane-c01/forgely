/**
 * Forgely motion tokens — easing curves & duration scale.
 * Source: docs/MASTER.md §17.4.
 *
 * Easings follow Material's "expressive" set (standard / decelerate /
 * accelerate). Durations follow a 5-step scale tuned for cinematic UI:
 * micro / short / medium / long / cinematic.
 */
export const motion = {
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    emphasized: 'cubic-bezier(0.2, 0.0, 0, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  duration: {
    micro: '120ms',
    short: '200ms',
    medium: '400ms',
    long: '600ms',
    cinematic: '1000ms',
  },
} as const

export type Motion = typeof motion
