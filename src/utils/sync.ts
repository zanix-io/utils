/**
 * A code-defined entry ready to be reconciled against its persisted counterpart.
 *
 * @category helpers
 */
export interface StaticSyncEntry<V> {
  /** Unique key identifying this entry (e.g. a model name, or a composite `"channel:name"`). */
  key: string
  /** The entry's current, code-defined content. */
  value: V
}

/**
 * A persisted entry, as read back from storage, to reconcile against its code-defined counterpart.
 *
 * @category helpers
 */
export interface PersistedSyncEntry<V, Id = unknown> {
  /** The persisted record's own identifier, echoed back in {@link SyncPlan} so the caller can act on it. */
  _id: Id
  /** Same `key` as the matching {@link StaticSyncEntry}. */
  key: string
  /** The entry's current, live content — may have been edited directly since the last sync. */
  value: V
  /** The code content last synced into `value`, if this entry has ever been synced from code. */
  lastSyncedValue?: V
}

/** What a code-to-storage sync pass should do, as decided by {@link planCodeSync}. */
export interface SyncPlan<V, Id = unknown> {
  /**
   * Persisted entries whose `key` no longer has a matching {@link StaticSyncEntry}. What to do
   * about that (delete the record, mark it as no longer code-owned, leave it as-is, etc.) is the
   * caller's decision — `planCodeSync` only detects the orphan, it never decides the write.
   */
  toOrphan: Array<{ _id: Id }>
  /** Persisted entries to overwrite with `value`, the current code-defined content. */
  toResync: Array<{ _id: Id; value: V }>
  /** Code-defined entries with no persisted record at all yet. */
  toSeed: StaticSyncEntry<V>[]
}

/**
 * Reconciles code-defined entries against their persisted counterparts, without ever overwriting
 * a manual edit — the same "does the live value still match what code last synced in?" check used
 * by `@zanix/datamaster`'s trigger sync and `@zanix/notifications`' database-templates sync (the
 * two real consumers this was extracted from). Pure — no I/O, no knowledge of what storage layer
 * `existing` came from or what `toOrphan`/`toResync`/`toSeed` get turned into.
 *
 * For each persisted entry:
 * - **Orphaned** (its `key` has no matching {@link StaticSyncEntry}) → reported via `toOrphan`.
 * - **Changed in code, untouched since the last sync** (`value` still equals `lastSyncedValue` —
 *   nobody edited it directly — but the current code value differs from that) → reported via
 *   `toResync`.
 * - **Changed in code, but also edited directly** (`value` no longer equals `lastSyncedValue`) →
 *   left alone entirely; a manual edit always wins over a later code change, with no exception.
 * - **No `lastSyncedValue` at all** (nothing on record says code ever synced this entry) → left
 *   alone, the same as a manual edit — there's no basis to say code "owns" it, so `planCodeSync`
 *   never resyncs an entry it can't prove is still untouched.
 *
 * Every code-defined entry with no persisted record at all (regardless of the above) is reported
 * via `toSeed`.
 *
 * @param staticEntries The current code-defined entries.
 * @param existing The persisted entries to reconcile against (pre-filtered by the caller to
 * whichever subset is meant to participate — e.g. only code-owned records).
 * @param equals Equality check for `V`. Defaults to `===`, which is correct for plain content like
 * a string; pass a deep/structural comparison when `V` is an object.
 */
export function planCodeSync<V, Id = unknown>(
  staticEntries: StaticSyncEntry<V>[],
  existing: PersistedSyncEntry<V, Id>[],
  equals: (a: V, b: V) => boolean = (a, b) => a === b,
): SyncPlan<V, Id> {
  const staticByKey = new Map(staticEntries.map((entry) => [entry.key, entry.value]))
  const existingKeys = new Set(existing.map((entry) => entry.key))

  const toOrphan: Array<{ _id: Id }> = []
  const toResync: Array<{ _id: Id; value: V }> = []

  for (const entry of existing) {
    const current = staticByKey.get(entry.key)
    if (current === undefined) {
      toOrphan.push({ _id: entry._id })
      continue
    }

    const untouchedSinceLastSync = entry.lastSyncedValue !== undefined &&
      equals(entry.value, entry.lastSyncedValue)
    const codeChanged = entry.lastSyncedValue === undefined ||
      !equals(current, entry.lastSyncedValue)

    if (untouchedSinceLastSync && codeChanged) {
      toResync.push({ _id: entry._id, value: current })
    }
  }

  const toSeed = staticEntries.filter((entry) => !existingKeys.has(entry.key))

  return { toOrphan, toResync, toSeed }
}
