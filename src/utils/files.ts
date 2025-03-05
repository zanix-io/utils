/** Helper function to check if a file exists */
export const fileExists = (path: string): boolean => {
  try {
    Deno.statSync(path)
    return true
  } catch {
    return false
  }
}
