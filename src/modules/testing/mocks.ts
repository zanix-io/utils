// deno-lint-ignore-file ban-types no-explicit-any

/**
 * Creates a mock version of the provided function.
 *
 * This function wraps the given `fn` in a specific context, simulating its behavior within the provided
 * context for testing purposes.
 *
 * @param fn The function to be wrapped by the mock. This is the function that will execute within the simulated context.
 * @param context The context in which the function will run. It should be an object with properties that will apply to the execution context of `fn`.
 * @param force The flag to force override without type validation
 *
 * @returns A new function that, when called, will execute using the provided context.
 *
 * @example
 *
 * ```ts
 * function myFunction() {
 *   return user();
 * }
 * const mock = mockWrap(myFunction, { user: () => 'testUser' });
 * mock();  // Here, `myFunction` will return 'testUser'
 * ```
 */
export function mockWrap<F extends Function>(
  this: any,
  fn: F,
  context: Record<string, any>,
  force?: boolean,
): F {
  let fnString = fn.toString()

  // Adding the object context
  Object.entries(context).forEach(([key, value]) => {
    if (typeof value === 'function' && !force) {
      fnString = fnString.replace(new RegExp(`${key}\\(`, 'g'), ` this.${key}(`)
    } else {
      fnString = fnString.replace(new RegExp(`${key}`, 'g'), `this.${key}`)
    }
  })

  const baseFn = new Function('return ' + fnString)
  let newFn

  if (typeof fn.prototype === 'object') newFn = baseFn.apply(this, arguments)
  else {
    // For arrow functions
    newFn = function (this: never) {
      return baseFn.apply(this).apply(this, arguments)
    }
  }

  return newFn.bind(context as never)
}
