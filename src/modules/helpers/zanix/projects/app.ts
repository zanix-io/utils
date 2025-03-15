import type { ZanixAppSrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { join } from '@std/path'

let appTree: ZanixAppSrcTree | undefined

const library = '@zanix/app'

export const getAppSrcTree = (root: string): ZanixAppSrcTree => {
  const mainRoot = join(root, 'src/app')
  if (appTree?.FOLDER === mainRoot) return appTree

  return ZanixTree.create<ZanixAppSrcTree>(mainRoot, {
    subfolders: {
      Components: { templates: { base: { files: ['ExampleComponent.txs'], library } } },
      Layout: { templates: { base: { files: ['ExampleLayout.txs'], library } } },
      Pages: { templates: { base: { files: ['ExamplePage.tsx'], library } } },
      resources: {
        subfolders: {
          intl: {
            subfolders: { es: { templates: { base: { files: ['example.json'], library } } } },
          },
          public: {
            subfolders: {
              assets: {
                subfolders: {
                  docs: { templates: { base: { files: ['example.md'], library } } },
                  fonts: { templates: { base: { files: ['example.woff2'], library } } },
                  icons: { templates: { base: { files: ['example.svg'], library } } },
                  images: { templates: { base: { files: ['example.webp'], library } } },
                  videos: { templates: { base: { files: ['example.webm'], library } } },
                },
              },
              scripts: { templates: { base: { files: ['example.js'], library } } },
              sitemap: { templates: { base: { files: ['main.xml', 'urls.xml'], library } } },
              styles: {
                templates: { base: { files: ['fonts.css'], library } },
                subfolders: {
                  global: { templates: { base: { files: ['example.css'], library } } },
                  apps: { templates: { base: { files: ['example.app.css'], library } } },
                },
              },
            },
          },
        },
      },
    },
  })
}
