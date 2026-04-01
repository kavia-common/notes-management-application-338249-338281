/**
 * Notes domain helpers (core logic layer).
 * Pure-ish utilities that can be unit-tested independently.
 */

// PUBLIC_INTERFACE
export function deriveTagsFromNotes(notes) {
  /** Derive a sorted unique list of tags from note arrays. */
  const map = new Map();
  (notes || []).forEach((n) => {
    (n?.tags || []).forEach((t) => {
      const key = String(t || "").trim();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
  });

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// PUBLIC_INTERFACE
export function filterNotes(notes, { query, tag }) {
  /** Filter notes by free-text query and optional tag. */
  const q = (query || "").trim().toLowerCase();
  const tagKey = tag ? String(tag).trim().toLowerCase() : null;

  return (notes || []).filter((n) => {
    if (tagKey) {
      const tags = (n?.tags || []).map((t) => String(t).toLowerCase());
      if (!tags.includes(tagKey)) return false;
    }

    if (!q) return true;

    const haystack = `${n?.title || ""}\n${n?.content || ""}\n${(n?.tags || []).join(
      " "
    )}`.toLowerCase();

    return haystack.includes(q);
  });
}

// PUBLIC_INTERFACE
export function sortNotesByUpdatedDesc(notes) {
  /** Sort notes by updated_at desc (fallback: created_at desc). */
  const toTs = (iso) => {
    const v = Date.parse(iso || "");
    return Number.isFinite(v) ? v : 0;
  };

  return [...(notes || [])].sort((a, b) => {
    const au = toTs(a?.updated_at) || toTs(a?.created_at);
    const bu = toTs(b?.updated_at) || toTs(b?.created_at);
    return bu - au;
  });
}

// PUBLIC_INTERFACE
export function formatRelativeTime(iso) {
  /** Minimal relative time formatter for updated_at labels. */
  const ts = Date.parse(iso || "");
  if (!Number.isFinite(ts)) return "";
  const diffMs = Date.now() - ts;

  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(diffMs / 3600000);
  const day = Math.floor(diffMs / 86400000);

  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 14) return `${day}d ago`;

  return new Date(ts).toLocaleDateString();
}
