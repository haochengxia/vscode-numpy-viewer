/**
 * Escape untrusted data before inserting it into WebView HTML.
 *
 * Keep this separate from the trusted markup used to lay out arrays and tables.
 */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function arrayValuesToHtml(values: unknown): string {
  const hasLength = values !== null
    && values !== undefined
    && typeof values !== 'string'
    && typeof (values as {length?: unknown}).length === 'number';
  const items = hasLength ? Array.from(values as ArrayLike<unknown>) : [values];
  return items.map(escapeHtml).join(',');
}
