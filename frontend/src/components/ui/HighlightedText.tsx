/** Wraps every word of `query` (3+ letters) found in `text` in a <mark>. */
export default function HighlightedText({ text, query }: { text: string; query: string }) {
  const words = [...new Set(query.toLowerCase().split(/\s+/).filter((w) => w.length >= 3))]
  if (!words.length) return <>{text}</>
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(pattern)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-brand/25 px-0.5 text-inherit">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
