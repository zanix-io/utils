import type {
  ClassFieldDecoratorMeta,
  RTOFieldMetadata,
  ValidationOptions,
} from 'typings/validations.ts'

/**
 * Private key namespacing this registry inside `context.metadata`, so it never collides with
 * metadata a different decorator system might store on the same class.
 */
const RTO_FIELDS_KEY = Symbol('zanix:rto-fields')

type FieldsRegistry = Record<string, RTOFieldMetadata>

/**
 * Registers a decorated `BaseRTO` accessor into the class-level field registry, keyed on the
 * class currently being defined via the native decorator metadata (`context.metadata`,
 * `Symbol.metadata`) — no `reflect-metadata`, no instance required. Runs once per accessor, at
 * class-definition time.
 */
export function registerClassField(
  context: ClassAccessorDecoratorContext,
  property: string,
  opts: ValidationOptions,
  meta?: ClassFieldDecoratorMeta,
): void {
  const registry = context.metadata as { [RTO_FIELDS_KEY]?: FieldsRegistry }
  const fields = registry[RTO_FIELDS_KEY] ??= Object.create(null)
  fields[property] = {
    decorator: meta?.decorator,
    args: meta?.args ?? [],
    each: !!opts.each,
    optional: !!opts.optional,
    expose: !!opts.expose,
  }
}

/**
 * Resolves the merged field registry for `RTO`, walking its own prototype chain.
 *
 * The native decorator metadata registry doesn't chain by inheritance on its own in this
 * runtime — a subclass's `[Symbol.metadata]` doesn't automatically include the entries its
 * parent class registered, even though the parent's actual accessor behavior (its real
 * getter/setter) does inherit normally through `Base.prototype`. This walks the chain manually,
 * merging base-first so a field the subclass redeclares overrides the parent's entry.
 */
export function resolveClassFields(
  // deno-lint-ignore no-explicit-any
  RTO: new (...args: any[]) => unknown,
): FieldsRegistry {
  const chain: FieldsRegistry[] = []

  let current: unknown = RTO
  while (typeof current === 'function' && current !== Function.prototype) {
    const registry = (current as { [Symbol.metadata]?: { [RTO_FIELDS_KEY]?: FieldsRegistry } })[
      Symbol.metadata
    ]
    const fields = registry?.[RTO_FIELDS_KEY]
    if (fields) chain.unshift(fields)
    current = Object.getPrototypeOf(current)
  }

  return Object.assign(Object.create(null), ...chain)
}
