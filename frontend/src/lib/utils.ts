export function formatSize(bytes: number | null | undefined): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB')
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", else a date. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ''
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d} d ago` : formatDate(iso)
}

export interface DayGroup<T> {
  label: 'Today' | 'Yesterday' | 'Earlier'
  items: T[]
}

/** Buckets items (newest first, by `updatedAt`) into Today / Yesterday / Earlier, dropping empty buckets. */
export function groupByDay<T extends { updatedAt: string }>(items: T[], now: Date = new Date()): DayGroup<T>[] {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const today = startOfDay(now)
  const yesterday = startOfDay(new Date(today - 1)) // DST-safe: step back from midnight instead of subtracting 24h
  const groups: DayGroup<T>[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ]
  for (const item of items) {
    const day = startOfDay(new Date(item.updatedAt))
    groups[day >= today ? 0 : day >= yesterday ? 1 : 2].items.push(item)
  }
  return groups.filter((g) => g.items.length > 0)
}

/** crypto.randomUUID() needs https or localhost; this falls back for plain-http access. */
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
export const ACCEPTED_EXT = ['.pdf', '.doc', '.docx', '.md', '.txt', '.csv']
