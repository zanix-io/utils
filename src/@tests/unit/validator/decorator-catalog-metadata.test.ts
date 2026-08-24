import { BaseRTO, classMetadata } from 'modules/validations/mod.ts'
import { ArrayLength } from 'modules/validations/decorators/arrays/length.ts'
import { MaxDate } from 'modules/validations/decorators/dates/max-date.ts'
import { MinDate } from 'modules/validations/decorators/dates/min-date.ts'
import { IsDate } from 'modules/validations/decorators/dates/is-date.ts'
import { ValidateNested } from 'modules/validations/decorators/nested.ts'
import { MaxNumber } from 'modules/validations/decorators/numbers/max-number.ts'
import { MinNumber } from 'modules/validations/decorators/numbers/min-number.ts'
import { IsBooleanString } from 'modules/validations/decorators/strings/is-boolean-string.ts'
import { IsEmail } from 'modules/validations/decorators/strings/is-email.ts'
import { IsNumberString } from 'modules/validations/decorators/strings/is-number-string.ts'
import { IsObjectID } from 'modules/validations/decorators/strings/is-object-id.ts'
import { IsPhone } from 'modules/validations/decorators/strings/is-phone.ts'
import { IsString } from 'modules/validations/decorators/strings/is-string.ts'
import { IsUrl } from 'modules/validations/decorators/strings/is-url.ts'
import { IsUUID } from 'modules/validations/decorators/strings/is-uuid.ts'
import { Length } from 'modules/validations/decorators/strings/length.ts'
import { Match } from 'modules/validations/decorators/strings/match.ts'
import { assertEquals } from '@std/assert'

// Regression coverage for https://github.com/zanix-io/utils/issues/11: `classMetadata` only
// identified 6 of the ~22 real catalog decorators — the rest registered their field with
// `decorator: undefined`, which is indistinguishable from a genuinely custom decorator built via
// the public `defineValidationDecorator`/`Validation()` (see `class-metadata.test.ts`'s own
// "a custom decorator with no meta tag" case). Downstream introspection (e.g. `@zanix/cli`'s
// OpenAPI generator) can't recognize a field's real decorator without this.
//
// Every one of these decorators is wired through `defineCatalogValidationDecorator` (see
// `base/definitions/decorators.ts`), whose `meta` parameter is required — so a NEW catalog
// decorator that forgets to identify itself fails `deno check` on its own; this test locks in
// that the CURRENT catalog's real names and `args` are exactly what a consumer would expect.
class AddressRTO extends BaseRTO {
  @IsString({ expose: true })
  accessor city!: string
}

class FullCatalogRTO extends BaseRTO {
  @ValidateNested(AddressRTO, { optional: true })
  accessor address!: AddressRTO

  @Match(/^[a-z]+$/, { optional: true })
  accessor slug!: string

  @IsUrl({ optional: true })
  accessor website!: string

  @IsNumberString({ optional: true })
  accessor zip!: string

  @IsEmail({ optional: true })
  accessor email!: string

  @IsBooleanString({ optional: true })
  accessor flag!: string

  @IsObjectID({ optional: true })
  accessor recordId!: string

  @Length({ min: 2, max: 10 }, { optional: true })
  accessor nickname!: string

  @IsUUID({ optional: true })
  accessor traceId!: string

  @MinDate(new Date('2020-01-01'), { optional: true })
  accessor startedAfter!: Date

  @MaxDate(new Date('2030-01-01'), { optional: true })
  accessor startedBefore!: Date

  @IsPhone({ optional: true })
  accessor phone!: string

  @IsDate({ optional: true })
  accessor when!: Date

  @MinNumber(1, { optional: true })
  accessor atLeast!: number

  @ArrayLength({ min: 1, max: 5 }, { optional: true })
  accessor items!: unknown[]

  @MaxNumber(100, { optional: true })
  accessor atMost!: number
}

Deno.test('classMetadata - every catalog decorator identifies itself', () => {
  const meta = classMetadata(FullCatalogRTO)

  assertEquals(meta.address.decorator, 'ValidateNested')
  assertEquals(meta.address.args, [AddressRTO])

  assertEquals(meta.slug.decorator, 'Match')
  assertEquals((meta.slug.args[0] as RegExp).source, /^[a-z]+$/.source)

  assertEquals(meta.website.decorator, 'IsUrl')
  assertEquals(meta.website.args, [])

  assertEquals(meta.zip.decorator, 'IsNumberString')
  assertEquals(meta.email.decorator, 'IsEmail')
  assertEquals(meta.flag.decorator, 'IsBooleanString')
  assertEquals(meta.recordId.decorator, 'IsObjectID')

  assertEquals(meta.nickname.decorator, 'Length')
  assertEquals(meta.nickname.args, [{ min: 2, max: 10 }])

  assertEquals(meta.traceId.decorator, 'IsUUID')

  assertEquals(meta.startedAfter.decorator, 'MinDate')
  assertEquals(meta.startedAfter.args, [new Date('2020-01-01')])

  assertEquals(meta.startedBefore.decorator, 'MaxDate')
  assertEquals(meta.startedBefore.args, [new Date('2030-01-01')])

  assertEquals(meta.phone.decorator, 'IsPhone')
  assertEquals(meta.when.decorator, 'IsDate')

  assertEquals(meta.atLeast.decorator, 'MinNumber')
  assertEquals(meta.atLeast.args, [1])

  assertEquals(meta.items.decorator, 'ArrayLength')
  assertEquals(meta.items.args, [{ min: 1, max: 5 }])

  assertEquals(meta.atMost.decorator, 'MaxNumber')
  assertEquals(meta.atMost.args, [100])
})
