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
    const plainValues = validationsMetadata.getPlainPayload(this.constructor.prototype)
    let plainValue = plainValues[property]
    const isDefault = value !== undefined && plainValue === value // has default value

    const data = plainValue ?? (exposeDefaults ? value : undefined) // choose default or instanced param

    // Each array adaptation
    plainValue = (!each || Array.isArray(data)) ? data : data !== undefined ? [data] : undefined

    if (expose) defineExpose.call(this, { property, value, plainValue, optional, messageResult })

    if (data === undefined && optional || isDefault) {
      const optionalProperties = validationsMetadata.getOptionalProperties(this)
      optionalProperties[property] = true
    }
  }
}

/**
 * Setter definition: Executes when a property is assigned a value.
 */
export const defineSetter = <T extends BaseRTO = BaseRTO>(
  { property, messageResult, validation, originalSetter, transform }: {
    transform: Required<ValidationOptions>['transform']
    property: string
    messageResult: ValidationMessage
    validation: ValidationFunction<T>
    originalSetter: (this: any, value: any) => void
  },
) => {
  return function (this: T, val: any) {
    if (
      !this.constructor.prototype.validate ||
      val?.constructor?.prototype._initialized_
    ) {
      delete val.constructor.prototype._initialized_
      return originalSetter.call(this, val) // For basic instance usage. `validate` is only `true` when using ClassValidator.
    }

    val = val !== undefined ? transform(val) : val

    const exposedValues = validationsMetadata.getExposedProperties(this)
    const validationInst = validationInstance.call(this, exposedValues)
    const constraints = [messageResult(property, val, validationInst)]

    const plainValue = validationsMetadata.getPlainPayload(this.constructor.prototype)[property]
    const error: ValidationError = { constraints, property, target: this, value: val, plainValue }

    const optionalProperties = validationsMetadata.getOptionalProperties(this)
    const validate = optionalProperties[property] ||
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
