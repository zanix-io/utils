/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * Pure TypeScript types used across `@zanix/utils`: decorator options, logger and error shapes,
 * encryption/masking options, the Zanix project/folder model, and more.
 *
 * @module zanixTypes
 */

export type {
  DefaultLogger,
  ZanixBaseFolder,
  ZanixBaseFolderProps,
  ZanixBaseLibraryInfo,
  ZanixFolderGenericTree,
  ZanixFolderTree,
  ZanixGlobal,
  ZanixLibraries,
  ZanixLibrarySrcTree,
  ZanixLocalContentProps,
  ZanixProjects,
  ZanixProjectsFull,
  ZanixServerSrcTree,
  ZanixSpaceSrcTree,
  ZanixSrcTree,
  ZanixSrcTreeMap,
  ZanixTemplates,
  ZanixTemplatesRecord,
} from 'typings/zanix.ts'

export type {
  BaseFormattedLog,
  BaseLoggerOptions,
  BaseMethods,
  BaseStorage,
  Console as GlobalConsole,
  ConsoleInfo,
  ConsoleMethodFor,
  DefaultFormattedLog,
  DefaultResponse,
  Formatter as LoggerFormatter,
  LoggerData,
  LoggerFileOptions,
  LoggerFunctionOptions,
  LoggerMethods,
  LoggerOptions,
  SaveDataFile,
  SaveDataFileOptions,
  SaveDataFunction as LoggerSaveData,
  SaveDataFunctionOptions,
} from 'typings/logger.ts'

/** The base internal `Logger` class that `Logger` (from `@zanix/utils/logger`) extends. */
export type { Logger as LoggerBase } from 'modules/logger/main.ts'

export type { TaskCallback, TaskCallbackResponse, TaskFunction } from 'typings/workers.ts'

export type {
  BaseSerializeError,
  ErrorOptions,
  HttpErrorCodes as HttpErrors,
  SerializeError,
} from 'typings/errors.ts'

export type { ConfigFile } from 'typings/config.ts'

export type { FormatAvailableFiles, LinterAvailableFiles } from 'typings/files.ts'

export type {
  ClassFieldDecoratorMeta,
  DefaultTransformValidationOpts,
  RTOFieldDecoratorEntry,
  RTOFieldMetadata,
  RtoTypes,
  ValidationConstraints,
  ValidationDecorator,
  ValidationDecoratorDefinition,
  ValidationError,
  ValidationFunction,
  ValidationMessage,
  ValidationOptions,
} from 'typings/validations.ts'

export type { EnumType } from 'modules/validations/decorators/generic/is-enum.ts'

export type {
  MaskingAlgorithms,
  MaskingBaseOptions,
  MaskingOptions,
  UnMaskingOptions,
} from 'typings/masking.ts'

export type {
  AESLength,
  EncryptionLevel,
  HashAlgorithm,
  ValidRSAKeysOptions,
  ValidRSAModulusLength,
} from 'typings/encryption.ts'
