import validationsMetadata from './metadata.ts'

/**
 * BaseRTO: Request Transfer Object
 *
 * This abstract class provides the base functionality for handling the validation of request data.
 * It includes methods for setting validation errors and triggering custom error handling logic.
 * It is intended to be extended by other classes that need to validate incoming data in request transfer objects.
 *
 * @example
 * ```ts
 * class UserRTO extends BaseRTO {
 *   constructor(data:UserRTO){
 *      super()
 *      this.age = Number(data.age);
 *   }
 *
 *   ´@IsString({ expose: true })
 *   accessor name!: string;
 *
 *   ´@IsEmail({ expose: true })
 *   accessor email!: string;
 *
 *   ´@IsNumber()
 *   accessor age!: number;
 * }
 * ```
 *
 * **Note**: All properties must be defined as accessors. However, the object is returned as a plain property without a getter.
 *  If you want the properties to be resolved as getters, you can change the `exposeValuesAsGetter` option in the `classValidation` configuration.
 *
 * Avoid using multiple decorators on a single property; prefer one per property to optimize validation performance.
 *
 * @category Validations
 */
export abstract class BaseRTO<Context extends object = object> {
  /**
   * Context injected for internal RTO usage.
   * It is assigned during RTO initialization and can be provided via `classValidation`.
   */
  protected context: Context

  constructor() {
    this.context = validationsMetadata.getValidationSetup(this.constructor.prototype).context
  }
}
