// deno-lint-ignore-file no-explicit-any
import type { BaseRTO } from 'modules/validations/base/rto.ts'
import type { ValidationMessage } from 'typings/validations.ts'

import { validationInstance } from './instances.ts'
import validationsMetadata from '../metadata.ts'

/**
 * Expose definition: Used when the `expose` property or decorator is applied.
 */
export function defineExpose(
  this: BaseRTO<any>,
  { property, messageResult, value, optional, plainValue }: {
    property: string
    plainValue?: string
    messageResult: ValidationMessage
    value: any
    optional?: boolean
  },
) {
  const exposedValues = validationsMetadata.getExposedProperties(this)

  if (value?.constructor?.prototype._initialized_ && typeof plainValue === 'object') {
    const defaultKeys = Object.keys(value)

    // Default keys assignation
    for (let i = 0; i < defaultKeys.length; i++) {
      const key = defaultKeys[i]
      if (plainValue[key] === undefined) {
        plainValue[key] = value[key] as never
      }
    }
  } else if (!optional && plainValue === undefined) {
    validationsMetadata.setValidationError({
      property,
      constraints: [messageResult(property, value, validationInstance.call(this, exposedValues))],
      target: this,
      value,
      plainValue,
    })
  }

  exposedValues[property as never] = plainValue as never
}
