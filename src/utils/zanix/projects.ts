import { getConfigDir, getRootDir } from 'utils/paths.ts'

const root = `${getRootDir()}/`

export const ZNX_STRUCT = {
  FOLDER: `${root}`,
  files: {
    DENO: getConfigDir(),
    MOD: `${root}mod.ts`,
    README: `${root}README.md`,
    gitignore: `${root}.gitignore`,
  },
  subfolders: {
    dist: {
      FOLDER: `${root}.dist`,
      files: { APP: `${root}.dist/app.js` },
    },
    docs: {
      FOLDER: `${root}docs`,
      files: {
        CHANGELOG: `${root}docs/CHANGELOG.md`,
        DOCUMENTATION: `${root}docs/DOCUMENTATION.md`,
        LICENCE: `${root}docs/LICENCE`,
      },
    },
    src: {
      FOLDER: `${root}src`,
      subfolders: {
        tests: {
          FOLDER: `${root}src/@tests`,
          subfolders: {
            functional: {
              FOLDER: `${root}src/@tests/functional`,
              files: { EXAMPLE: `${root}src/@tests/functional/example.text.ts` },
            },
            integration: {
              FOLDER: `${root}src/@tests/integration`,
              files: { EXAMPLE: `${root}src/@tests/integration/example.text.ts` },
            },
            unit: {
              FOLDER: `${root}src/@tests/unit`,
              files: { EXAMPLE: `${root}src/@tests/unit/example.text.ts` },
            },
          },
        },
        app: {
          FOLDER: `${root}src/app`,
          subfolders: {
            components: {
              FOLDER: `${root}src/app/components`,
              files: {
                EXAMPLE: `${root}src/app/components/Example.txs`,
              },
            },
            layout: {
              FOLDER: `${root}src/app/layout`,
              files: {
                EXAMPLE: `${root}src/app/layout/GlobalFooter.txs`,
              },
            },
            pages: {
              FOLDER: `${root}src/app/pages`,
              files: {
                EXAMPLE: `${root}src/app/pages/Home.tsx`,
              },
            },
            resources: {
              FOLDER: `${root}src/resources`,
              subfolders: {
                intl: {
                  FOLDER: `${root}src/resources/intl`,
                  subfolders: {
                    es: {
                      FOLDER: `${root}src/resources/intl/es`,
                      files: {
                        EXAMPLE: `${root}src/resources/intl/es/example.json`,
                      },
                    },
                  },
                },
                public: {
                  FOLDER: `${root}src/resources/public`,
                  subfolders: {
                    assets: {
                      FOLDER: `${root}src/resources/public/assets`,
                      subfolders: {
                        docs: {
                          FOLDER: `${root}src/resources/public/assets/docs`,
                          files: {
                            EXAMPLE: `${root}src/resources/public/assets/docs/example.doc`,
                          },
                        },
                        fonts: {
                          FOLDER: `${root}src/resources/public/assets/fonts`,
                          files: {
                            EXAMPLE: `${root}src/resources/public/assets/fonts/example.font`,
                          },
                        },
                        icons: {
                          FOLDER: `${root}src/resources/public/assets/icons`,
                          files: {
                            EXAMPLE: `${root}src/resources/public/assets/icons/example.svg`,
                          },
                        },
                        images: {
                          FOLDER: `${root}src/resources/public/assets/images`,
                          files: {
                            EXAMPLE: `${root}src/resources/public/assets/images/example.webp`,
                          },
                        },
                        videos: {
                          FOLDER: `${root}src/resources/public/assets/videos`,
                          files: {
                            EXAMPLE: `${root}src/resources/public/assets/videos/example.webm`,
                          },
                        },
                      },
                      scripts: {
                        FOLDER: `${root}src/resources/public/scripts`,
                        files: {
                          EXAMPLE: `${root}src/resources/public/scripts/example.js`,
                        },
                      },
                      sitemap: {
                        FOLDER: `${root}src/resources/public/sitemap`,
                        files: {
                          EXAMPLE_MAIN: `${root}src/resources/public/scripts/main.xml`,
                          EXAMPLE_URL: `${root}src/resources/public/scripts/urls.xml`,
                        },
                      },
                      styles: {
                        FOLDER: `${root}src/resources/public/styles`,
                        files: {
                          fonts: `${root}src/resources/public/styles/font.css`,
                        },
                        subfolders: {
                          apps: {
                            FOLDER: `${root}src/resources/public/styles/apps`,
                            files: {
                              EXAMPLE: `${root}src/resources/public/styles/apps/example.app.css`,
                            },
                          },
                          global: {
                            FOLDER: `${root}src/resources/public/styles/global`,
                            files: {
                              EXAMPLE: `${root}src/resources/public/styles/global/example.css`,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        library: {
          FOLDER: `${root}src/library`,
          files: {
            EXAMPLE: `${root}src/library/mod.ts`,
          },
        },
        server: {
          FOLDER: `${root}src/server`,
          subfolders: {
            connectors: {
              FOLDER: `${root}src/server/contectors`,
              files: {
                EXAMPLE_PROVIDER: `${root}src/server/contectors/example.provider.ts`,
                EXAMPLE_CLIENT: `${root}src/server/contectors/example.client.ts`,
              },
            },
            handlers: {
              FOLDER: `${root}src/server/handlers`,
              files: {
                EXAMPLE_CONTROLLER: `${root}src/server/handlers/example.controller.ts`,
                EXAMPLE_RESOLVER: `${root}src/server/handlers/example.resolver.ts`,
                EXAMPLE_SUBSCRIBER: `${root}src/server/handlers/example.subscriber.ts`,
              },
              subfolders: {
                rtos: {
                  FOLDER: `${root}src/server/handlers/rtos`,
                  files: { EXAMPLE: `${root}src/server/handlers/rtos/example.rto.ts` },
                },
              },
            },
            interactors: {
              FOLDER: `${root}src/server/interactors`,
              files: {
                EXAMPLE_SERVICE: `${root}src/server/interactors/example.service.ts`,
              },
            },
            jobs: {
              FOLDER: `${root}src/server/jobs`,
              files: {
                EXAMPLE: `${root}src/server/jobs/example.job.ts`,
              },
            },
            repositories: {
              FOLDER: `${root}src/server/repositories`,
              files: {
                EXAMPLE_DATA: `${root}src/server/repositories/example.data.ts`,
                EXAMPLE_MODEL: `${root}src/server/repositories/example.model.ts`,
              },
              subfolders: {
                seeders: {
                  FOLDER: `${root}src/server/repositories/seeders`,
                  files: { EXAMPLE: `${root}src/server/repositories/seeders/example.seeder.ts` },
                },
              },
            },
          },
        },
        shared: {
          FOLDER: `${root}src/shared`,
          subfolders: {
            middlewares: {
              FOLDER: `${root}src/shared/middlewares`,
              files: {
                EXAMPLE_PIPE: `${root}src/shared/middlewares/example.pipe.ts`,
                EXAMPLE_INTERCEPTOR: `${root}src/shared/middlewares/example.interceptor.ts`,
              },
            },
          },
        },
        typings: {
          FOLDER: `${root}src/typings`,
          files: {
            EXAMPLE: `${root}src/typings/example.d.ts`,
            EXAMPLE_EXPORTED: `${root}src/typings/example.type.ts`,
          },
        },
        utils: {
          FOLDER: `${root}src/utils`,
          files: {
            EXAMPLE: `${root}src/utils/example.utils.ts`,
          },
        },
      },
    },
    zanix: {
      FOLDER: `${root}zanix`,
      files: {
        CONFIG: `${root}zanix/config.ts`,
        SECRETS: `${root}zanix/secrets.sqlite`,
      },
    },
  },
} as const

/**
 * Retrieves the recommended folder structure for Zanix projects based on the provided type.
 *
 * @param type - The type of the structure to retrieve.
 *                Use `server` to get the backend API folder structure, `app`
 *                to get the frontend SSR folder structure, or `library`.
 *                If you want to get `server` and `app` together, send `app-server` type.
 *
 * @returns A nested object representing the folder structure for the given type.
 */
export const getZanixPaths = <
  T extends Zanix.Projects = 'app-server',
>(_?: T): Zanix.FolderStructure<T> => {
  return ZNX_STRUCT as unknown as Zanix.FolderStructure<T>
}
