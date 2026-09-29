/** An owning LRU. Eviction always releases GPU and CPU resources through dispose.
 * Active entries are pinned; an oversized admission is rejected rather than growing
 * beyond the budget. Downloads/builds are serialized separately by PreviewRenderer. */
export class PreviewCache<T extends { bytes: number; dispose: () => void }> {
  private entries = new Map<string, T>();
  bytes = 0;
  readonly maxEntries: number;
  readonly maxBytes: number;

  constructor(maxEntries: number, maxBytes: number) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  get size() { return this.entries.size; }
  get(id: string) {
    const value = this.entries.get(id);
    if (value) {
      this.entries.delete(id);
      this.entries.set(id, value);
    }
    return value;
  }
  has(id: string) { return this.entries.has(id); }
  add(id: string, value: T, pinned: Set<string>): boolean {
    if (this.entries.has(id)) throw new Error(`Duplicate preview: ${id}`);
    if (value.bytes > this.maxBytes) { value.dispose(); return false; }
    for (const [key, entry] of this.entries) {
      if (this.size < this.maxEntries && this.bytes + value.bytes <= this.maxBytes) break;
      if (pinned.has(key)) continue;
      this.entries.delete(key);
      this.bytes -= entry.bytes;
      entry.dispose();
    }
    if (this.size >= this.maxEntries || this.bytes + value.bytes > this.maxBytes) {
      value.dispose();
      return false;
    }
    this.entries.set(id, value);
    this.bytes += value.bytes;
    return true;
  }
  clear() {
    for (const entry of this.entries.values()) entry.dispose();
    this.entries.clear();
    this.bytes = 0;
  }
}
