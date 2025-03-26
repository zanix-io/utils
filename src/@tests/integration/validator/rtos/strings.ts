import { BaseRTO, Expose, IsString } from 'modules/validations/mod.ts'

export class StringsRTO extends BaseRTO<{ stringPropExpose: string }> {
  constructor(data: StringsRTO) {
    super()
    this.stringPropWithInizializer = data.stringPropWithInizializer
  }

  @Expose()
  @IsString({
    message: (property, value, target: StringsRTO) => {
      return `costomized string message for ${property} with value ${value} and ctx '${target.context.stringPropExpose}'`
    },
  })
  accessor stringPropExpose!: string

  @IsString()
  accessor stringPropWithInizializer: string

  @IsString({ expose: true })
  accessor stringPropWithDefaults: string = 'default value'

  @IsString({ optional: true, expose: true })
  accessor stringPropOptional: string | undefined

  @IsString({ each: true, expose: true })
  accessor stringPropArray!: string[]
}
