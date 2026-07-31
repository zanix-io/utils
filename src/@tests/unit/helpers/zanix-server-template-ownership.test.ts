import { getZanixPaths } from 'modules/helpers/zanix/tree.ts'
import { assertStringIncludes } from '@std/assert'
import { stub } from '@std/testing/mock'

/**
 * Each server-tree template's `jsr` must point at whichever library actually owns the API its
 * content demonstrates (registerModel -> @zanix/datamaster, registerCronJob -> @zanix/asyncmq),
 * not just at @zanix/server because of the folder it lives under — otherwise the template would
 * create a circular dependency, since both of those libraries depend on @zanix/server. The RTO
 * example stays under @zanix/server despite importing @zanix/validator (a @zanix/utils subpath):
 * @zanix/utils sits *below* server in the dependency graph (no circular risk), and the RTO is
 * referenced via a relative import by the handler/interactor templates, which only resolves if
 * all three stay co-located in the same repo's `src/templates/`.
 */
async function fetchedJsrPackage(content: () => Promise<string>): Promise<string> {
  const requestedUrls: string[] = []
  const fetchStub = stub(
    globalThis,
    'fetch',
    // deno-lint-ignore no-explicit-any
    ((input: any) => {
      requestedUrls.push(String(input))
      return Promise.resolve(new Response('', { status: 404 }))
    }) as typeof fetch,
  )

  try {
    await content()
  } finally {
    fetchStub.restore()
  }

  return requestedUrls.find((url) => url.includes('jsr.io/')) ?? ''
}

Deno.test('server tree job template is owned by @zanix/asyncmq, not @zanix/server', async () => {
  const paths = getZanixPaths('server')
  const jobs = paths.subfolders.src.subfolders.server.subfolders.jobs

  const jsrRequest = await fetchedJsrPackage(() =>
    jobs.templates.base[0].content({ metaUrl: import.meta.url })
  )
  assertStringIncludes(jsrRequest, '@zanix/asyncmq')
})

Deno.test('server tree model/seeder templates are owned by @zanix/datamaster', async () => {
  const paths = getZanixPaths('server')
  const repositories = paths.subfolders.src.subfolders.server.subfolders.repositories

  const modelRequest = await fetchedJsrPackage(() =>
    repositories.templates.base[0].content({ metaUrl: import.meta.url })
  )
  const seederRequest = await fetchedJsrPackage(() =>
    repositories.subfolders.seeders.templates.base[0].content({ metaUrl: import.meta.url })
  )

  assertStringIncludes(modelRequest, '@zanix/datamaster')
  assertStringIncludes(seederRequest, '@zanix/datamaster')
})

Deno.test('server tree connector/handler/interactor/rto templates stay under server', async () => {
  const paths = getZanixPaths('server')
  const server = paths.subfolders.src.subfolders.server

  const connectorRequest = await fetchedJsrPackage(() =>
    server.subfolders.connectors.templates.base[0].content({ metaUrl: import.meta.url })
  )
  const handlerRequest = await fetchedJsrPackage(() =>
    server.subfolders.handlers.templates.base[0].content({ metaUrl: import.meta.url })
  )
  const interactorRequest = await fetchedJsrPackage(() =>
    server.subfolders.interactors.templates.base[0].content({ metaUrl: import.meta.url })
  )
  const rtoRequest = await fetchedJsrPackage(() =>
    server.subfolders.handlers.subfolders.rtos.templates.base[0].content({
      metaUrl: import.meta.url,
    })
  )

  assertStringIncludes(connectorRequest, '@zanix/server')
  assertStringIncludes(handlerRequest, '@zanix/server')
  assertStringIncludes(interactorRequest, '@zanix/server')
  assertStringIncludes(rtoRequest, '@zanix/server')
})
