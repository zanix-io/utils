/**
 * Function for formatting messages used in linter plugin output.
 * @param message - lint error
 */
export const linterMessageFormat = (message: string) => {
  return `❌ ${message}`
}
