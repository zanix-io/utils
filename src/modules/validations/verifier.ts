// deno-lint-ignore-file no-explicit-any
import type { ValidationSetupCtx } from 'typings/validations.ts'
import type { BaseRTO } from './base/rto.ts'

import validationsMetadata from './base/metadata.ts'

/**
 * Validates the provided data and returns the validation errors, if any.
 * The validation function should be implemented by a subclass to perform actual validation logic.
 *
 * @returns A promise that resolves to an array of validation errors, if any.
 * The errors represent the issues encountered during validation of the object's data.
 */
export async function validate<T extends BaseRTO>(
  RTO: new (data: any) => T,
  plainObject: any,
  setup: ValidationSetupCtx,
) {
  RTO.prototype.validate = true

  validationsMetadata.setValidationSetup(RTO.prototype, setup)
  validationsMetadata.setPlainPayload(RTO.prototype, plainObject)

  const obj = new RTO(plainObject)

  const exposedProps = validationsMetadata.getExposedProperties(obj)

  for (const key in exposedProps) {
    if (obj[key] === undefined) obj[key] = exposedProps[key]
  }

  setup.whiteListCallback(obj, plainObject)

  const errors = await validationsMetadata.getValidationErrors(obj)

  delete RTO.prototype.validate // Delete before getNestedProperties

  const nestedObj = validationsMetadata.getNestedProperties(RTO.prototype, 'obj')
  if (nestedObj) Object.assign(obj, nestedObj)

  const nestedErrors = validationsMetadata.getNestedProperties(RTO.prototype, 'error')

  if (nestedErrors) {
    const errorLength = errors.length
    for (let i = 0; i < errorLength; i++) {
      const error = errors[i]
      error.children = nestedErrors[error.property]
    }
  }

  // Delete obj metadata
  validationsMetadata.resetAll(obj)
  validationsMetadata.resetNested(RTO.prototype)
  validationsMetadata.resetAll(RTO.prototype)
  delete obj['validate' as never]
  delete obj['context' as never]

  return { obj, errors }
}
