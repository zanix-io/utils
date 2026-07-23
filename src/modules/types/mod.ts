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
  ZanixAppSrcTree,
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
  ZanixProjectSrc,
  ZanixServerSrcTree,
  ZanixSrcTree,
  ZanixSrcTreeMap,
  ZanixTemplates,
  ZanixTemplatesRecord,
} from 'typings/zanix.ts'

export type {
  BaseFormattedLog,
  BaseMethods,
  Console as GlobalConsole,
  ConsoleInfo,
  DefaultFormattedLog,
  DefaultResponse,
  Formatter as LoggerFormatter,
  LoggerData,
  LoggerMethods,
  SaveDataFunction as LoggerSaveData,
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

export type { BaseEditorHelperOptions, Editors } from 'typings/editor.ts'

export type {
  BaseGithubHelperOptions,
  HookOptions,
  PreCommitHookOptions,
  WorkflowOptions,
} from 'typings/github.ts'

export type { FormatAvailableFiles, LinterAvailableFiles } from 'typings/files.ts'

export type { PrepareGithubOptions } from 'modules/helpers/github/prepare.ts'

export type { CompilerOptions } from 'typings/builder.ts'

export type {
  DefaultTransformValidationOpts,
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
