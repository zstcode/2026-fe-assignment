import { useEffect, useState } from 'react'

/** Returns the latest value after it has stopped changing for delayMs. */
export default function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(() => value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(() => value), delayMs)
    return () => window.clearTimeout(timeout)
  }, [value, delayMs])

  return debouncedValue
}
