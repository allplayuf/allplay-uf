// Base44 visual-editor stub. The original component listened for
// postMessage events from the no-code editor's parent iframe to inject
// Tailwind class overlays. AllPlay no longer runs inside that iframe,
// so this is intentionally a no-op. Kept as an export so existing
// `import VisualEditAgent from '@/lib/VisualEditAgent'` call sites
// (e.g. src/App.jsx) keep resolving without changes.
export default function VisualEditAgent() {
  return null;
}
