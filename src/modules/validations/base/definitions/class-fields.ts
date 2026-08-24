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
 * `Symbol.metadata`) — no `reflect-metadata`, no instance required. Runs once per decorator
 * applied to the accessor, at class-definition time — so a property carrying two or more
 * stacked decorators (e.g. `@IsString() @Length({ min: 1, max: 100 })`) calls this once per
 * decorator, in the order each one applies.
 *
 * `decorator`/`args` are a plain overwrite — the last-registered decorator wins, matching this
 * function's original single-decorator behavior exactly. Every decorator in the stack is also
 * appended to `decorators`, so nothing is lost when a field carries more than one; a field with
 * only one decorator never gets a `decorators` entry at all, keeping its shape identical to
 * before this accumulation existed.
 *
 * `each`/`optional`/`expose` describe the field's own real runtime behavior, not one decorator's
 * identity, and that behavior is a genuine OR across the stack: `classValidation`'s setter/init
 * wiring (`accessors.ts`) shares one `optionalProperties`/exposed-properties state per property,
 * so a value is treated as optional, or gets exposed, the moment ANY stacked decorator's own
 * options say so — regardless of what the others say. OR-merging here keeps the metadata
 * truthful to that shared runtime state instead of reflecting whichever decorator happened to
 * register last.
 */
export function registerClassField(
  context: ClassAccessorDecoratorContext,
  property: string,
  opts: ValidationOptions,
  meta?: ClassFieldDecoratorMeta,
): void {
  const registry = context.metadata as { [RTO_FIELDS_KEY]?: FieldsRegistry }
  const fields = registry[RTO_FIELDS_KEY] ??= Object.create(null)
  const previous = fields[property]

  const decorators = previous
    ? [
      ...(previous.decorators ?? [{ decorator: previous.decorator, args: previous.args }]),
      { decorator: meta?.decorator, args: meta?.args ?? [] },
    ]
    : undefined

  fields[property] = {
    decorator: meta?.decorator,
    args: meta?.args ?? [],
    ...(decorators ? { decorators } : {}),
    each: !!opts.each || !!previous?.each,
    optional: !!opts.optional || !!previous?.optional,
    expose: !!opts.expose || !!previous?.expose,
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
