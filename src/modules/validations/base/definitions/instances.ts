import type { BaseRTO } from 'modules/validations/base/rto.ts'

/**
 * Validation instance definition for validation functions use
 */
// deno-lint-ignore no-explicit-any
export const validationInstance = function (this: any, exposedValues: BaseRTO) {
  return {
    ...exposedValues,
    ...this,
    constructor: { prototype: this.constructor.prototype, name: this.constructor.name },
  }
}
