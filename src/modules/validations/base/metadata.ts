// deno-lint-ignore-file no-explicit-any
import type { NestedProperties, ValidationError, ValidationSetupCtx } from 'typings/validations.ts'

import type { BaseRTO } from './rto.ts'

/**
 * Class to manage internal validations metadata
 */
export class ValidationsMetadata {
  #exposePropertiesKey = 'exposeValues'
  #optionalPropertiesKey = 'optionalValues'
  #validationOptionsKey = 'validationOptions'
  #plainPayloadKey = 'plainPayload'
  #nestedPropsKey = 'nestedObj'
  #errorKey = 'errorKeys'

  /**
   * set plain playload metadata object to RTO
   */
  public setPlainPayload<T extends BaseRTO>(container: T, payload: any = {}) {
    Reflect.set(container, this.#plainPayloadKey, payload)
    this.setExposedProperties(container, {})
  }

  /**
   * get plain playload metadata object
   */
  public getPlainPayload<T extends BaseRTO = BaseRTO>(container: T) {
    return (Reflect.get(container, this.#plainPayloadKey) || {}) as Record<
      string,
      string | undefined
    >
  }

  /**
   * set expose properties from payload data object
   */
  public setExposedProperties<T extends BaseRTO>(
    container: T,
    properties: { [key: string]: any },
  ) {
    Reflect.set(container, this.#exposePropertiesKey, properties)
  }

  /**
   * get exposes properties from payload data object
   */
  public getExposedProperties<T extends BaseRTO>(container: T) {
    let values = Reflect.get(container, this.#exposePropertiesKey)
    if (!values) {
      this.setExposedProperties(container, {})
      values = Reflect.get(container, this.#exposePropertiesKey)
    }
    return values as T
  }

  /**
   * set optional properties from payload data object
   */
  public setOptionalProperties<T extends BaseRTO>(
    container: T,
    properties: { [key: string]: boolean },
  ) {
    Reflect.set(container, this.#optionalPropertiesKey, properties)
  }

  /**
   * get optional properties from payload data object
   */
  public getOptionalProperties<T extends BaseRTO>(container: T) {
    let values = Reflect.get(container, this.#optionalPropertiesKey)
    if (!values) {
      this.setOptionalProperties(container, {})
      values = Reflect.get(container, this.#optionalPropertiesKey)
    }
    return values as { [key: string]: boolean }
  }

  /**
   * set validation setup
   */
  public setValidationSetup<T extends BaseRTO>(
    container: T,
    opts: ValidationSetupCtx,
  ) {
    const options = this.getValidationSetup(container)
    Reflect.set(container, this.#validationOptionsKey, { ...options, ...opts, target: container })
  }

  /**
   * get validation setup
   */
  public getValidationSetup<T extends BaseRTO>(container: T) {
    return (Reflect.get(container, this.#validationOptionsKey) || {}) as ValidationSetupCtx
  }

  /**
   * set nested properties
   */
  public setNestedProperties<T extends BaseRTO, K extends 'error' | 'obj'>(
    container: T,
    key: K,
    data: NestedProperties<K>,
  ) {
    Reflect.set(container, `${this.#nestedPropsKey}:${key}`, data)
  }

  /**
   * get nested properties
   */
  public getNestedProperties<T extends BaseRTO, K extends 'error' | 'obj'>(container: T, key: K) {
    const keyValue = `${this.#nestedPropsKey}:${key}`
    let values = Reflect.get(container, keyValue)
    if (!values) {
      this.setNestedProperties(container, key, {})
      values = Reflect.get(container, keyValue)
    }
    return values as NestedProperties<K>
  }

  /**
   * Sets the validation error by pushing the error to the internal errors array.
   * This method is used to capture errors during the validation process.
   *
   * @param error - ValidationError object that will be added to the error list.
   * @param pending - A promise that resolves validation function
   */
  public setValidationError(
    error: ValidationError,
    pending?: Promise<boolean | undefined>,
  ) {
    type ErrorType = Promise<ValidationError | undefined>

    const key = `${this.#errorKey}:${error.property}`
    const keys = Reflect.get(error.target, this.#errorKey) as string[]
    if (!keys) Reflect.set(error.target, this.#errorKey, [key])
    else if (!keys.includes(key)) keys.push(key)

    delete error.value?.context
    let currentError = Reflect.get(error.target, key) as ErrorType | undefined
    if (currentError) {
      this.errorPendingResolve(() => this.addConstraint(error.constraints, currentError), pending)
    } else currentError = this.errorPendingResolve(() => error, pending)

    Reflect.set(error.target, key, currentError)
  }

  /**
   * get validation errors
   */
  public async getValidationErrors<T extends BaseRTO>(container: T) {
    type ErrorType = Promise<ValidationError | undefined>
    const keys = (Reflect.get(container, this.#errorKey) || []) as string[] // get error keys
    const errors = await Promise.all(keys.map((key) => {
      return Reflect.get(container, key) as ErrorType
    }))

    return errors.filter(Boolean) as ValidationError[]
  }

  /**
   * Flush all validations metadata
   */
  public resetAll<T extends BaseRTO>(container: T) {
    Reflect.deleteProperty(container.constructor.prototype, this.#validationOptionsKey)
    Reflect.deleteProperty(container, this.#validationOptionsKey)
    Reflect.deleteProperty(container, this.#exposePropertiesKey)
    Reflect.deleteProperty(container, this.#optionalPropertiesKey)
    Reflect.deleteProperty(container.constructor.prototype, this.#plainPayloadKey)
    Reflect.deleteProperty(container, this.#plainPayloadKey)
    const keys = (Reflect.get(container, this.#errorKey) || []) as string[]
    keys.forEach((key) => Reflect.deleteProperty(container, key))
    Reflect.deleteProperty(container, this.#errorKey)
    delete container['context' as never]
  }

  /**
   * Flush nested
   */
  public resetNested<T extends BaseRTO>(container: T) {
    Reflect.deleteProperty(container, `${this.#nestedPropsKey}:error`)
    Reflect.deleteProperty(container, `${this.#nestedPropsKey}:obj`)
    Reflect.deleteProperty(container.constructor.prototype, `${this.#nestedPropsKey}:error`)
    Reflect.deleteProperty(container.constructor.prototype, `${this.#nestedPropsKey}:obj`)
  }

  /**
   * Add error constraints
   */
  private addConstraint(constrains: string[], currentError?: Promise<ValidationError | undefined>) {
    currentError?.then((err) => {
      if (!err) return
      err.constraints = Array.from(new Set([...err.constraints, ...constrains]))
    })
  }

  /**
   * Error resolve as a promise
   */
  private async errorPendingResolve(toReturn: () => any, pending?: Promise<boolean | undefined>) {
    if (pending === undefined) return toReturn()
    const isAnError = await pending
    return isAnError ? toReturn() : undefined
  }
}

/**
 * Class instance to manage internal validations metadata
 */
const validationsMetadata = new ValidationsMetadata()
export default validationsMetadata
