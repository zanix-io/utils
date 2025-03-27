import { IsNumber } from 'modules/validations/decorators/numbers/is-number.ts'
import { ValidateNested } from 'modules/validations/decorators/nested.ts'
import { StringsRTO } from './strings.ts'
import { NumbersRTO } from './numbers.ts'
import { BaseRTO } from 'modules/validations/mod.ts'
import { DatesRTO } from './dates.ts'

class SecondLevelRTO extends StringsRTO {
  @IsNumber()
  accessor numericSecondLevel!: number
}

class FirstLevelRTO extends DatesRTO {
  @ValidateNested(SecondLevelRTO, { each: true })
  accessor Second!: SecondLevelRTO[]
}

export class ValidateNestedRTO extends BaseRTO {
  @ValidateNested(FirstLevelRTO, { optional: true })
  accessor First: FirstLevelRTO | undefined

  @ValidateNested(NumbersRTO, { optional: true, each: true })
  accessor NumbersOptionals: NumbersRTO[] | undefined

  @ValidateNested(NumbersRTO)
  accessor NumbersDefault: NumbersRTO = new NumbersRTO({ numberValue: '31' })

  @ValidateNested(NumbersRTO)
  accessor NumbersRequired!: NumbersRTO

  @ValidateNested(NumbersRTO, { each: true })
  accessor NumbersDefaultArray: NumbersRTO[] = [
    new NumbersRTO({ numberValue: '1' }),
    new NumbersRTO({ numberValue: '2' }),
  ]
}

export class ValidateNestedDefaultArrayRTO extends BaseRTO {
  @ValidateNested(NumbersRTO, { each: true })
  accessor NumbersDefaultArray: NumbersRTO[] = [
    new NumbersRTO({ numberValue: '1' }),
    new NumbersRTO({ numberValue: '2' }),
  ]
}
