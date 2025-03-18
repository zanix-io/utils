/** The Editors type is a union type that defines a set of supported text editors. */
export type Editors = 'vscode'

export type BaseEditorHelperOptions = {
  /** The current directory */
  baseRoot?: string
}

/** The editor helper options */
export type EditorOptions = { type: Editors }
