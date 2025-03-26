export const defaultTransform = (transform?: boolean) =>
  transform
    ? (value?: string) => {
      if (value) return new Date(value)
    }
    : undefined
