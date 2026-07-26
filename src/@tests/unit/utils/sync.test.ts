import { assertEquals } from '@std/assert'
import { planCodeSync } from 'utils/sync.ts'
import type { PersistedSyncEntry, StaticSyncEntry } from 'utils/sync.ts'

const welcome: StaticSyncEntry<string> = { key: 'welcome', value: 'Hola {{name}}' }

function existing(
  overrides: Partial<PersistedSyncEntry<string>> = {},
): PersistedSyncEntry<string> {
  return {
    _id: 'id-1',
    key: 'welcome',
    value: 'Hola {{name}}',
    lastSyncedValue: 'Hola {{name}}',
    ...overrides,
  }
}

Deno.test('planCodeSync: a new code entry with no persisted record is seeded', () => {
  const plan = planCodeSync([welcome], [])

  assertEquals(plan.toSeed, [welcome])
  assertEquals(plan.toResync, [])
  assertEquals(plan.toOrphan, [])
})

Deno.test('planCodeSync: an unchanged, untouched entry is left alone', () => {
  const plan = planCodeSync([welcome], [existing()])

  assertEquals(plan.toSeed, [])
  assertEquals(plan.toResync, [])
  assertEquals(plan.toOrphan, [])
})

Deno.test('planCodeSync: a code change resyncs an entry nobody edited since the last sync', () => {
  const changed: StaticSyncEntry<string> = { key: 'welcome', value: 'Hola {{firstName}}!' }
  const plan = planCodeSync([changed], [existing()])

  assertEquals(plan.toResync, [{ _id: 'id-1', value: 'Hola {{firstName}}!' }])
  assertEquals(plan.toSeed, [])
  assertEquals(plan.toOrphan, [])
})

Deno.test({
  name: 'planCodeSync: a manually-edited entry is never overwritten by a later code change',
  fn: () => {
    const editedByUser = existing({ value: '¡Hola {{name}}, bienvenido!' }) // value !== lastSyncedValue
    const changed: StaticSyncEntry<string> = { key: 'welcome', value: 'Hola {{firstName}}!' }

    const plan = planCodeSync([changed], [editedByUser])

    assertEquals(plan.toResync, [])
    assertEquals(plan.toSeed, [])
    assertEquals(plan.toOrphan, [])
  },
})

Deno.test({
  name:
    'planCodeSync: an entry with no lastSyncedValue on record is left alone, like a manual edit',
  fn: () => {
    const untracked = existing({ lastSyncedValue: undefined })
    const changed: StaticSyncEntry<string> = { key: 'welcome', value: 'Hola {{firstName}}!' }

    const plan = planCodeSync([changed], [untracked])

    assertEquals(plan.toResync, [])
  },
})

Deno.test({
  name: 'planCodeSync: an orphaned entry (no matching code key) is reported, not acted on',
  fn: () => {
    const plan = planCodeSync([], [existing()])

    assertEquals(plan.toOrphan, [{ _id: 'id-1' }])
    assertEquals(plan.toResync, [])
    assertEquals(plan.toSeed, [])
  },
})

Deno.test('planCodeSync: handles several independent keys in one pass', () => {
  const other: StaticSyncEntry<string> = { key: 'generic', value: '{{{content}}}' }

  const plan = planCodeSync(
    [welcome, other],
    [existing(), existing({ _id: 'id-2', key: 'generic', value: '', lastSyncedValue: '' })],
  )

  assertEquals(plan.toSeed, [])
  assertEquals(plan.toResync, [{ _id: 'id-2', value: '{{{content}}}' }])
  assertEquals(plan.toOrphan, [])
})

Deno.test('planCodeSync: accepts a custom equals for structural/deep content', () => {
  type Trigger = { post?: { created?: string[] } }
  const staticTrigger: StaticSyncEntry<Trigger> = {
    key: 'User',
    value: { post: { created: ['job-a'] } },
  }
  const deepEqual = (a: Trigger, b: Trigger) => JSON.stringify(a) === JSON.stringify(b)

  // Untouched (persisted value still matches lastSyncedValue by deep content, not reference).
  const untouched: PersistedSyncEntry<Trigger> = {
    _id: 'id-3',
    key: 'User',
    value: { post: { created: ['job-a'] } },
    lastSyncedValue: { post: { created: ['job-a'] } },
  }
  assertEquals(planCodeSync([staticTrigger], [untouched], deepEqual).toResync, [])

  // Code changed, still untouched -> resync.
  const changedTrigger: StaticSyncEntry<Trigger> = {
    key: 'User',
    value: { post: { created: ['job-a', 'job-b'] } },
  }
  assertEquals(planCodeSync([changedTrigger], [untouched], deepEqual).toResync, [
    { _id: 'id-3', value: { post: { created: ['job-a', 'job-b'] } } },
  ])
})
