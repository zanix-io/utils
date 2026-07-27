// deno-coverage-ignore-file

import {
  ArrayLength,
  BaseRTO,
  IsArray,
  IsEmail,
  IsEnum,
  IsNumberString,
  IsUrl,
  IsUUID,
  Length,
  Match,
  Validation,
} from 'modules/validations/mod.ts'
import { IsPhone } from 'modules/validations/decorators/strings/is-phone.ts'
import { IsBooleanString } from 'modules/validations/decorators/strings/is-boolean-string.ts'
import { IsBoolean } from 'modules/validations/decorators/generic/is-boolean.ts'
import { MaxNumber } from 'modules/validations/decorators/numbers/max-number.ts'
import { MinNumber } from 'modules/validations/decorators/numbers/min-number.ts'
import { MaxDate } from 'modules/validations/decorators/dates/max-date.ts'
import { MinDate } from 'modules/validations/decorators/dates/min-date.ts'

/**
 * Fixture used only to exercise the `each: true` / `each: false` branch selection
 * of decorators that no other RTO fixture applies. Kept isolated so other suites
 * that share `rtos/strings.ts`, `rtos/numbers.ts`, etc. are not affected.
 */
export class EachBranchesRTO extends BaseRTO {
  constructor(data: Partial<EachBranchesRTO>) {
    super()
    for (const key of Object.keys(data) as (keyof EachBranchesRTO)[]) {
      // deno-lint-ignore no-explicit-any
      ;(this as any)[key] = data[key]
    }
  }

  @IsEmail({ optional: true })
  accessor email: string | undefined

  @IsEmail({ each: true, optional: true })
  accessor emails: string[] | undefined

  @IsUUID({ optional: true })
  accessor uuid: string | undefined

  @IsUUID({ each: true, optional: true })
  accessor uuids: string[] | undefined

  @IsUrl({ optional: true })
  accessor url: string | undefined

  @IsUrl({ each: true, optional: true })
  accessor urls: string[] | undefined

  @IsPhone({ optional: true })
  accessor phone: string | undefined

  @IsPhone({ each: true, optional: true })
  accessor phones: string[] | undefined

  @Length({ min: 1, max: 5 }, { optional: true })
  accessor shortString: string | undefined

  @Length({ min: 1, max: 5 }, { each: true, optional: true })
  accessor shortStrings: string[] | undefined

  @Match(/^[a-z]+$/, { optional: true })
  accessor lowercase: string | undefined

  @Match(/^[a-z]+$/, { each: true, optional: true })
  accessor lowercases: string[] | undefined

  @IsBooleanString({ optional: true })
  accessor booleanString: string | undefined

  @IsBooleanString({ each: true, optional: true })
  accessor booleanStrings: string[] | undefined

  @IsBoolean({ optional: true })
  accessor flag: boolean | undefined

  @IsBoolean({ each: true, optional: true })
  accessor flags: boolean[] | undefined

  @IsArray({ optional: true })
  accessor list: unknown[] | undefined

  @IsArray({ each: true, optional: true })
  accessor lists: unknown[][] | undefined

  @ArrayLength({ min: 1, max: 3 }, { optional: true })
  accessor boundedList: unknown[] | undefined

  @ArrayLength({}, { optional: true })
  accessor unboundedList: unknown[] | undefined

  @Validation<EachBranchesRTO>(() => true, { optional: true })
  accessor customValid: string | undefined

  @Validation<EachBranchesRTO>(() => true, { each: true, optional: true })
  accessor customValidEach: string[] | undefined

  @IsEnum(['A', 'B'], { optional: true })
  accessor enumValue: string | undefined

  @IsEnum(['A', 'B'], { each: true, optional: true })
  accessor enumValues: string[] | undefined

  @MaxNumber(5, { each: true, optional: true })
  accessor maxNumbers: number[] | undefined

  @MinNumber(1, { each: true, optional: true })
  accessor minNumbers: number[] | undefined

  @MaxDate(new Date('2999-01-01'), { each: true, optional: true })
  accessor maxDates: Date[] | undefined

  @MinDate(new Date('2000-01-01'), { each: true, optional: true })
  accessor minDates: Date[] | undefined

  @IsNumberString({ each: true, optional: true })
  accessor numberStrings: string[] | undefined
}
