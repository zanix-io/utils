import type { Logger } from 'modules/logger/main.ts'
import type { ZanixGlobal } from 'typings/zanix.ts'

type DefaultLogger = typeof Logger['prototype']

declare global {
  const Znx: ZanixGlobal['Znx']
  interface Window extends ZanixGlobal {}
}
