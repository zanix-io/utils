import type { ZanixAppSrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { join } from '@std/path'

let appTree: ZanixAppSrcTree | undefined

const jsr = '@zanix/app'

export const getAppSrcTree = (root: string): ZanixAppSrcTree => {
  const startingPoint = join(root, 'src/app')
  if (appTree?.FOLDER === startingPoint) return appTree

  return ZanixTree.create<ZanixAppSrcTree>({ startingPoint, baseRoot: root }, {
    subfolders: {
      Components: { templates: { base: { files: ['ExampleComponent.tsx'], jsr } } },
      Layout: { templates: { base: { files: ['ExampleLayout.tsx'], jsr } } },
      Pages: { templates: { base: { files: ['ExamplePage.tsx'], jsr } } },
      resources: {
        subfolders: {
          intl: {
            subfolders: { es: { templates: { base: { files: ['example.json'], jsr } } } },
          },
          public: {
            subfolders: {
              assets: {
                subfolders: {
                  docs: { templates: { base: { files: ['example.md'], jsr } } },
                  fonts: { templates: { base: { files: ['example.woff2'], jsr } } },
                  icons: { templates: { base: { files: ['example.svg'], jsr } } },
                  images: { templates: { base: { files: ['example.webp'], jsr } } },
                  videos: { templates: { base: { files: ['example.webm'], jsr } } },
                },
              },
              scripts: { templates: { base: { files: ['example.js'], jsr } } },
              sitemap: { templates: { base: { files: ['main.xml', 'urls.xml'], jsr } } },
              styles: {
                templates: { base: { files: ['fonts.css'], jsr } },
                subfolders: {
                  global: { templates: { base: { files: ['example.css'], jsr } } },
                  apps: { templates: { base: { files: ['example.app.css'], jsr } } },
                },
              },
            },
          },
        },
      },
    },
  })
}
