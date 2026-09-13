// deno-lint-ignore-file no-explicit-any
import type { ValidationError, ValidationFunction, ValidationOptions } from 'modules/types/mod.ts'
import type { BaseRTO } from 'modules/validations/base/rto.ts'
import type { ValidationMessage } from 'typings/validations.ts'

import { validationInstance } from './instances.ts'
import validationsMetadata from '../metadata.ts'
import { defineExpose } from './exposes.ts'

/**
 * Initialization definition: Occurs when RTO is instantiated in the constructor.
 */
export const defineInit = (
  opts: ValidationOptions,
  { messageResult, property }: {
    messageResult: ValidationMessage
    property: string
  },
) => {
  const { expose, each, optional } = opts

  return function (this: BaseRTO<any>, value: any) {
    if (!this.constructor.prototype.validate) {
      this.constructor.prototype._initialized_ = true
      return value // For basic instance usage. `validate` is only `true` when using ClassValidator.
    }

    // Default or transformed values
    const { expose: exposeDefaults } = validationsMetadata.getValidationSetup(
      this.constructor.prototype,
    )
    const plainValues = validationsMetadata.getPlainPayload(
      this.constructor.prototype,
    )
    let plainValue = plainValues[property]
    const isDefault = value !== undefined && plainValue === value // has default value

    const data = plainValue ?? (exposeDefaults ? value : undefined) // choose default or instanced param

    // Each array adaptation
    plainValue = (!each || Array.isArray(data)) ? data : data !== undefined ? [data] : undefined

    if (expose) {
      defineExpose.call(this, {
        property,
        value,
        plainValue,
        optional,
        messageResult,
      })
    }

    if (data === undefined && optional || isDefault) {
      const optionalProperties = validationsMetadata.getOptionalProperties(
        this,
      )
      optionalProperties[property] = true
    }
  }
}

/**
 * Setter definition: Executes when a property is assigned a value.
 */
export const defineSetter = <T extends BaseRTO = BaseRTO>(
  { property, messageResult, validation, originalSetter, transform, optional }: {
    transform: Required<ValidationOptions>['transform']
    property: string
    messageResult: ValidationMessage
    validation: ValidationFunction<T>
    originalSetter: (this: any, value: any) => void
    /** Whether this field's own decorator was declared `{ optional: true }` — threaded through
     * so an empty-string raw input (a plain HTML form's own shape for "nothing entered here")
     * is treated the same as a genuinely absent one. See the real fix below for why this
     * matters. */
    optional?: boolean
  },
) => {
  return function (this: T, val: any) {
    const isInitializedInstance = val?.constructor?.prototype._initialized_
    if (!this.constructor.prototype.validate || isInitializedInstance) {
      // Only clear the marker when `val` actually carried one — the OTHER branch above
      // (`!this.constructor.prototype.validate`, plain "basic instance usage" with no
      // ClassValidator) can be true with `val` itself `null`/`undefined` (e.g. explicitly
      // assigning `undefined` to an optional accessor), in which case there is no
      // `val.constructor` to read at all. Reaching for it unconditionally, as this used to,
      // threw `Cannot read properties of undefined (reading 'constructor')` for exactly that
      // case — a real, confirmed crash on `new SomeRTO().optionalField = undefined`, not a
      // theoretical one.
      if (isInitializedInstance) delete val.constructor.prototype._initialized_
      return originalSetter.call(this, val) // For basic instance usage. `validate` is only `true` when using ClassValidator.
    }

    const rawVal = val
    // A plain HTML `<form>` always submits every named field, including an untouched optional
    // one — as an EMPTY STRING, never an absent key. Checked against `rawVal` (never a bare
    // falsy check): a real `0`/`false` value for an optional number/boolean field must still
    // validate normally, never get treated as absent. See the real fix's own doc, further down
    // at `validate`'s own definition, for the full rationale and the confirmed bug this guards.
    const isEmptyOptionalInput = optional && rawVal === ''
    // Bypasses `transform` entirely for this case, rather than trusting its own output to come
    // out `undefined` for an empty string: confirmed live that it doesn't uniformly — `IsDate`'s
    // own transform does (`if (value) return new Date(value)`), but `IsNumber`'s does not
    // (`Number('')` is `0` in JS, a real, well-known quirk — `IsNumber`'s own transform has no
    // reason to special-case it, since it was never designed to see an empty string in the first
    // place while `optional` silently dropped it before reaching here). Forcing `undefined`
    // directly is correct regardless of what any given decorator's own transform happens to do
    // with `''`.
    val = isEmptyOptionalInput ? undefined : val !== undefined ? transform(val) : val

    const exposedValues = validationsMetadata.getExposedProperties(this)
    const validationInst = validationInstance.call(this, exposedValues)
    const constraints = [messageResult(property, val, validationInst)]

    const plainValue = validationsMetadata.getPlainPayload(this.constructor.prototype)[property]
    const error: ValidationError = {
      constraints,
      property,
      target: this,
      value: val,
      plainValue,
    }

    const optionalProperties = validationsMetadata.getOptionalProperties(this)
    // `optionalProperties[property]` alone never catches a plain HTML `<form>`'s own empty-
    // string shape for an untouched optional field: that flag is only ever set from
    // `defineInit`'s own check against the RAW pre-transform payload, and `'' !== undefined`
    // there, so an empty-string field was never recognized as "optional and absent" before —
    // it fell straight through to `validation.call(...)` on its post-transform value, which
    // then failed (confirmed live: an empty-string `importantDate` on an `{ optional: true }`
    // field was rejected as "not a valid Date object", even though the exact same field
    // submitted as a genuinely absent key validated fine). `isEmptyOptionalInput` (computed
    // above, before `transform` even ran) is this same real, confirmed fix — see its own doc
    // for why it's checked against the RAW value, specifically `=== ''`, never a bare falsy
    // check or the post-transform value alone.
    const validate = optionalProperties[property] ||
      isEmptyOptionalInput ||
      validation.call(validationInst, val, property)
    if (validate instanceof Promise) {
      const pending = validate.then((ok) => {
        if (ok) originalSetter.call(this, val)
        else return true
      })
      validationsMetadata.setValidationError(error, pending)
    } else if (validate) originalSetter.call(this, val)
    else validationsMetadata.setValidationError(error)
  }
}
