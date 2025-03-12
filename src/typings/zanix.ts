import type { ZNX_STRUCT } from 'modules/helpers/zanix/projects/main.ts'
import type { Logger } from 'modules/logger/main.ts'

type ZnxFolderStructure = typeof ZNX_STRUCT

type DefaultLogger = typeof Logger['prototype']

/**
 * Defines the 'ZanixProjects' type, which is a reference to ZnxProjects
 * This type represents the available projects in Zanix.
 */
export type ZanixProjects = 'library' | 'server' | 'app' | 'app-server'

type ZnxSubfoldersRewrited<O extends ZanixProjects> = Omit<
  ZnxFolderStructure['subfolders']['src']['subfolders'],
  O
>

type ZnxFolderStructureModified<T extends ZanixProjects> =
  & Omit<ZnxFolderStructure, 'subfolders'>
  & {
    subfolders: Omit<ZnxFolderStructure['subfolders'], 'src'> & {
      src: Omit<ZnxFolderStructure['subfolders']['src'], 'subfolders'> & {
        subfolders: 'library' extends T ? ZnxSubfoldersRewrited<'app' | 'server'>
          : T extends 'app' ? ZnxSubfoldersRewrited<'library' | 'server'>
          : T extends 'server' ? ZnxSubfoldersRewrited<'app' | 'library'>
          : ZnxSubfoldersRewrited<'library'>
      }
    }
  }

/**
 * Defines a generic 'FolderStructure' type that depends on the 'Projects' type
 * for Zanix applications.
 */
export type FolderStructure<T extends ZanixProjects = never> = T extends never ? ZnxFolderStructure
  : ZnxFolderStructureModified<T>

/** Zanix Server Folder structure */
export type ZanixServerFolders = {
  FOLDER: string
  get NAME(): string
  subfolders: {
    connectors: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_PROVIDER: string
        EXAMPLE_CLIENT: string
      }
    }
    handlers: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_CONTROLLER: string
        EXAMPLE_RESOLVER: string
        EXAMPLE_SUBSCRIBER: string
      }
      subfolders: {
        rtos: {
          FOLDER: string
          get NAME(): string
          files: { EXAMPLE: string }
        }
      }
    }
    interactors: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_SERVICE: string
      }
    }
    jobs: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE: string
      }
    }
    repositories: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_DATA: string
        EXAMPLE_MODEL: string
      }
      subfolders: {
        seeders: {
          FOLDER: string
          get NAME(): string
          files: { EXAMPLE: string }
        }
      }
    }
  }
}

/** Zanix Library Folder structure */
export type ZanixLibraryFolders = {
  FOLDER: string
  get NAME(): string
  files: {
    EXAMPLE: string
  }
}

/** Zanix App Folder structure */
export type ZanixAppFolders = {
  FOLDER: string
  get NAME(): string
  subfolders: {
    components: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE: string
      }
    }
    layout: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE: string
      }
    }
    pages: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE: string
      }
    }
    resources: {
      FOLDER: string
      get NAME(): string
      subfolders: {
        intl: {
          FOLDER: string
          get NAME(): string
          subfolders: {
            es: {
              FOLDER: string
              files: {
                EXAMPLE: string
              }
            }
          }
        }
        public: {
          FOLDER: string
          get NAME(): string
          subfolders: {
            assets: {
              FOLDER: string
              get NAME(): string
              subfolders: {
                docs: {
                  FOLDER: string
                  get NAME(): string
                  files: {
                    EXAMPLE: string
                  }
                }
                fonts: {
                  FOLDER: string
                  get NAME(): string
                  files: {
                    EXAMPLE: string
                  }
                }
                icons: {
                  FOLDER: string
                  get NAME(): string
                  files: {
                    EXAMPLE: string
                  }
                }
                images: {
                  FOLDER: string
                  get NAME(): string
                  files: {
                    EXAMPLE: string
                  }
                }
                videos: {
                  FOLDER: string
                  get NAME(): string
                  files: {
                    EXAMPLE: string
                  }
                }
              }
              scripts: {
                FOLDER: string
                get NAME(): string
                files: {
                  EXAMPLE: string
                }
              }
              sitemap: {
                FOLDER: string
                get NAME(): string
                files: {
                  EXAMPLE_MAIN: string
                  EXAMPLE_URL: string
                }
              }
              styles: {
                FOLDER: string
                get NAME(): string
                files: {
                  fonts: string
                }
                subfolders: {
                  apps: {
                    FOLDER: string
                    get NAME(): string
                    files: {
                      EXAMPLE: string
                    }
                  }
                  global: {
                    FOLDER: string
                    get NAME(): string
                    files: {
                      EXAMPLE: string
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

/** Zanix general folders */
export type ZanixFolders = {
  FOLDER: string
  get NAME(): string
  files: {
    DENO: string | null
    MOD: string
    README: string
    gitignore: string
  }
  subfolders: {
    dist: {
      FOLDER: string
      get NAME(): string
      files: { APP: string }
    }
    docs: {
      FOLDER: string

      get NAME(): string
      files: {
        CHANGELOG: string
        DOCUMENTATION: string
        LICENCE: string
      }
    }
    src: {
      FOLDER: string

      get NAME(): string
      subfolders: {
        tests: {
          FOLDER: string

          get NAME(): string
          subfolders: {
            functional: {
              FOLDER: string

              get NAME(): string
              files: { EXAMPLE: string }
            }
            integration: {
              FOLDER: string

              get NAME(): string
              files: { EXAMPLE: string }
            }
            unit: {
              FOLDER: string

              get NAME(): string
              files: { EXAMPLE: string }
            }
          }
        }
        app: ZanixAppFolders
        library: ZanixLibraryFolders
        server: ZanixServerFolders
        shared: {
          FOLDER: string

          get NAME(): string
          subfolders: {
            middlewares: {
              FOLDER: string

              get NAME(): string
              files: {
                EXAMPLE_PIPE: string
                EXAMPLE_INTERCEPTOR: string
              }
            }
          }
        }
        typings: {
          FOLDER: string

          get NAME(): string
          files: {
            INDEX: string
          }
        }
        utils: {
          FOLDER: string

          get NAME(): string
          files: {
            EXAMPLE: string
          }
        }
      }
    }
    zanix: {
      FOLDER: string

      get NAME(): string
      files: {
        CONFIG: string
        SECRETS: string
      }
    }
  }
}

/**
 * Global library type modules definition
 */
// TODO: Add a global declaration once JSR supports global namespaces.
export interface ZanixGlobal {
  /** The global logger default instance */
  logger: DefaultLogger
  /** The global onmessage function for workers */
  onmessage?: Worker['onmessageerror']
  /** The global postMessage function for workers */
  postMessage?: Worker['postMessage']
  /** The global zanix module */
  Znx: {
    /** The logger Ref */
    logger: ZanixGlobal['logger']
    /** The base config data */
    config: {
      project?: ZanixProjects
      hash?: string
    }
  }
}
