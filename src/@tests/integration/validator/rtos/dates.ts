import { BaseRTO, IsDate, MaxDate, MinDate } from 'modules/validations/mod.ts'

export class DatesRTO extends BaseRTO {
  constructor(data: DatesRTO) {
    super()
    this.date3 = new Date(data.date3)
  }

  @IsDate()
  accessor date1: Date = new Date()

  @IsDate()
  accessor date2!: Date

  @IsDate({ transform: false })
  accessor date3: Date

  @IsDate({ each: true, optional: true })
  accessor date4: Date[] | undefined

  @MaxDate(new Date('2020-01-01'), { optional: true })
  accessor date5: Date | undefined

  @MinDate(new Date('2020-01-01'), { optional: true })
  accessor date6: Date | undefined
}
