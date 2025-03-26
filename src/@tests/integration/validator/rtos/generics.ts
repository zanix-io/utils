import { BaseRTO, Expose, IsNumberString, IsString, Validation } from 'modules/validations/mod.ts'
import { IsNumber } from 'modules/validations/decorators/numbers/is-number.ts'

export class ValidatorRTO extends BaseRTO {
  @Validation<ValidatorRTO>(function () {
    return this.stringPropWithDefaults === '5' && this.value === '4'
  }, {
    expose: true,
    message: (property, value, target) => {
      return `validation message for ${property}:'${value}'. 'stringPropWithDefaults' must be '5' and 'value' must be '4'. data: {stringPropWithDefaults: ${target.stringPropWithDefaults}, valueOptional:'${target.valueOptional}' and value:${target.value}}`
    },
  })
  accessor compoundRequiredVal: string = 'default value'

  @IsNumberString({ expose: true })
  accessor stringPropWithDefaults: string = '5'

  @IsNumberString({ expose: true, optional: true })
  accessor value: string | undefined

  @IsNumber()
  accessor valueOptional: number = 3
}

export class ExposeRTO extends BaseRTO {
  constructor(data: ExposeRTO) {
    super()
    this.age = data.age // Assigns the age property from the provided data
  }
  @Expose() // Exposes the property without transformation logic.
  @IsString()
  accessor value: string | undefined

  @IsNumberString({ expose: true, optional: true })
  accessor numberString: string | undefined // Exposes property use.

  @Expose() // Exposes the property without validation or transformation logic
  accessor test!: string

  @Expose() // Exposes the defaulted property with transformation logic but without validation. It remains optional.
  accessor age: number = 3

  @Expose({ optional: true }) // Exposes optional properties without validation and transformation logic
  accessor optionalValue: number | undefined

  @IsString({
    optional: true,
    transform: (value) => {
      if (value) {
        return `value:${value}`
      }
    },
  }) // No expose optional properties with validation and transformation logic
  accessor optionalValue2: string | undefined

  @Expose({
    optional: true,
    transform: (value) => {
      if (value) {
        return `value:${value}`
      }
    },
  }) // Exposes with default transformation logic
  accessor optionalValue3: string | undefined
}
