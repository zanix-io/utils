export const defaultTransform = (transform?: boolean) =>
  transform
    ? (value?: string) => {
      const number = Number(value)
      if (value && !isNaN(number)) return number
    }
    : undefined
