// deno-coverage-ignore-file

import {
  BaseRTO,
  Expose,
  IsEnum,
  IsNumber,
  IsString,
  RequiredWhen,
  Validation,
} from 'modules/validations/mod.ts'

/** Multi-intent RTO: the trigger `intent` is declared FIRST, the conditional fields after it. */
export class IntentFirstRTO extends BaseRTO {
  @IsEnum(['create', 'delete', 'update'], { expose: true })
  accessor intent!: 'create' | 'delete' | 'update'

  @RequiredWhen<IntentFirstRTO>('intent', 'create', { message: 'line1-required' })
  accessor line1: string | undefined

  @RequiredWhen<IntentFirstRTO>('intent', 'create')
  accessor city: string | undefined

  @RequiredWhen<IntentFirstRTO>('intent', ['create', 'update'], { message: 'phone-required' })
  accessor phone: string | undefined

  @RequiredWhen<IntentFirstRTO>('intent', (rto) => rto.intent !== 'delete')
  accessor note: string | undefined

  @IsString({ expose: true, optional: true })
  accessor id: string | undefined
}

/** Same RTO with the trigger declared LAST: the declaration order must not matter. */
export class IntentLastRTO extends BaseRTO {
  @RequiredWhen<IntentLastRTO>('intent', 'create', { message: 'line1-required' })
  accessor line1: string | undefined

  @RequiredWhen<IntentLastRTO>('intent', 'create')
  accessor city: string | undefined

  @RequiredWhen<IntentLastRTO>('intent', ['create', 'update'], { message: 'phone-required' })
  accessor phone: string | undefined

  @RequiredWhen<IntentLastRTO>('intent', (rto) => rto.intent !== 'delete')
  accessor note: string | undefined

  @IsString({ expose: true, optional: true })
  accessor id: string | undefined

  @IsEnum(['create', 'delete', 'update'], { expose: true })
  accessor intent!: 'create' | 'delete' | 'update'
}

/** The trigger is a plain `@Expose()` string, not validated by any decorator. */
export class ExposedTriggerRTO extends BaseRTO {
  @RequiredWhen<ExposedTriggerRTO>('mode', 'strict', { message: 'name-required' })
  accessor name: string | undefined

  @Expose({ optional: true })
  accessor mode: string | undefined
}

/** The trigger is neither exposed nor decorated with `expose`: it is read from the payload. */
export class UnexposedTriggerRTO extends BaseRTO {
  constructor(data: { mode: string }) {
    super()
    this.mode = data.mode // assigned in the constructor, after `name` is already declared
  }

  @RequiredWhen<UnexposedTriggerRTO>('mode', 'strict', { message: 'name-required' })
  accessor name: string | undefined

  @IsString()
  accessor mode!: string
}

/** Numeric and boolean triggers, compared with the submitted (string) and the transformed value. */
export class TypedTriggerRTO extends BaseRTO {
  @RequiredWhen<TypedTriggerRTO>('level', 2, { message: 'a-required' })
  accessor a: string | undefined

  @RequiredWhen<TypedTriggerRTO>('flag', true, { message: 'b-required' })
  accessor b: string | undefined

  @IsNumber({ optional: true })
  accessor level: number | undefined

  @IsEnum(['true', 'false'], { expose: true, optional: true })
  accessor flag: string | undefined
}

/** `each` and `transform`. */
export class EachTransformRTO extends BaseRTO {
  @IsEnum(['create', 'delete'], { expose: true })
  accessor intent!: 'create' | 'delete'

  @RequiredWhen<EachTransformRTO>('intent', 'create', { each: true, message: 'tags-required' })
  accessor tags: string[] | undefined

  @RequiredWhen<EachTransformRTO>('intent', 'create', {
    transform: (value) => value?.trim(),
    message: 'title-required',
  })
  accessor title: string | undefined

  @RequiredWhen<EachTransformRTO>('intent', 'create')
  accessor defaulted: string | undefined
}

/** Default messages with `each`, and an asynchronous validation next to a conditional field. */
export class DefaultsAsyncRTO extends BaseRTO {
  @IsEnum(['create', 'delete'], { expose: true })
  accessor intent!: 'create' | 'delete'

  @RequiredWhen<DefaultsAsyncRTO>('intent', 'create', { each: true })
  accessor tags: string[] | undefined

  @Validation(async (value) => {
    await Promise.resolve()
    return value === undefined || value === 'ok'
  }, { expose: true, optional: true, message: 'async-failed' })
  accessor checked: string | undefined

  @RequiredWhen<DefaultsAsyncRTO>('intent', 'create')
  accessor name: string | undefined
}
