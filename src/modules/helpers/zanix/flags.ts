const ZNX_FLAGS = [
  'enablePipe:global',
  'enablePipe:app',
  'enablePipe:server',
  'enableModel',
  'useGlobalComponent:footer',
  'useGlobalComponent:header',
  'useGlobalComponent:suspense',
  'useGlobalComponent:error',
  'useServerRender',
  'useClientRender',
  'useStaticRender',
]

export default {
  /**
   * Zanix flags to enable different behaviors of a module:
   *
   * - `'enablePipe'` – Enables pipe functionality for a function,
   *    allowing data transformations to be applied across all data processed by that function.
   *    This flag is useful for SERVER (BACKEND), APP (SSR: Server-Side Rendering), and global functionalities.
   *    It can be specified as `enablePipe:server`, `enablePipe:app`, or `enablePipe:global`.
   *
   * - `'enableModel'` - Enables model-related functionality. This flag is used to activate features related
   *    to the model in the application.
   *
   * - `'useGlobalComponent'` – Activates a global SSR component within the application.
   *    This flag is used to inject specific components into the app, such as the footer, header, suspense, or error components.
   *    It helps standardize the inclusion of global UI elements across different parts of the application.
   *    The components can be specified as useGlobalComponent:footer, useGlobalComponent:header, useGlobalComponent:suspense, or useGlobalComponent:error.
   *
   * -  These flags control the rendering behavior of `pages` in the application.
   *     - `'useServerRender'` enables server-side rendering, allowing components to be rendered on the server before being sent to the client.
   *     - `'useClientRender'` enables client-side rendering, where components are rendered directly in the browser after the page is loaded.
   *     - `'useStaticRender'` enables static rendering, where components are pre-rendered at build time for fast, static pages.
   *    These flags help determine the optimal rendering strategy based on the component's requirements and the desired performance.
   */
  ZNX_FLAGS,
}
