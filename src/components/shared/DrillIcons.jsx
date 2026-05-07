/**
 * DrillIcons — SVG icon components compartidos entre el drill principal
 * y los drills del módulo de aprendizaje.
 *
 * Todos usan fill/stroke="currentColor" para heredar el color del CSS.
 * Tamaño por defecto: 22×22 (override con width/height props o CSS).
 */

const SIZE = 22

export const ConfigSvg = ({ size = SIZE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
    <circle cx="8"  cy="6"  r="2" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
    <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
  </svg>
)

export const AccentsSvg = ({ size = SIZE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <text x="2" y="19" fontFamily="serif" fontSize="18" fontWeight="bold" fill="currentColor">Ñ</text>
  </svg>
)

export const MicSvg = ({ size = SIZE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
)

export const DiceSvg = ({ size = SIZE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5"  cy="8.5"  r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="8.5"  r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="8.5"  cy="12"   r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="12"   r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="8.5"  cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
)

export const ChartSvg = ({ size = SIZE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="3"  y="12" width="4" height="9"  rx="0.5"/>
    <rect x="10" y="6"  width="4" height="15" rx="0.5"/>
    <rect x="17" y="9"  width="4" height="12" rx="0.5"/>
    <rect x="2"  y="21" width="20" height="1.5" rx="0.5"/>
  </svg>
)

export const BackSvg = ({ size = SIZE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

export const HomeSvg = ({ size = SIZE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <polyline points="9 21 9 13 15 13 15 21"/>
  </svg>
)

export const SpeakerSvg = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  </svg>
)
