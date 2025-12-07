export const defaultTransform = (transform?: boolean) =>
  transform
    ? (value?: string) => {
      if (value !== undefined) return new Date(value)
    }
    : undefined
