import { BaseRTO, IsNumberString } from 'modules/validations/mod.ts'
import { IsNumber } from 'modules/validations/decorators/numbers/is-number.ts'
import { MaxNumber } from 'modules/validations/decorators/numbers/max-number.ts'
import { MinNumber } from 'modules/validations/decorators/numbers/min-number.ts'

export class NumbersRTO extends BaseRTO {
  constructor(data: Partial<NumbersRTO>) {
    super()
    if (data.numberValue) {
      this.numberValue = data.numberValue
    }
  }
  @IsNumberString({ expose: true })
  accessor stringNumber: string = '1'

  @IsNumberString({ expose: true })
  accessor numberValue!: string

  @IsNumber({ optional: true })
  accessor numberA!: number

  @IsNumber({ each: true, optional: true })
  accessor numbers!: number[]

  @IsNumber({ each: true })
  accessor numbersDefault: number[] = [1, 2, 3]

  @MaxNumber(3, { optional: true })
  accessor maxNumber!: number

  @MinNumber(3, { optional: true })
  accessor minNumber!: number

  @IsNumber()
  accessor valueOptional: number = 0
}
