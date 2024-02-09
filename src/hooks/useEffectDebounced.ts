import { useEffect } from 'react'

export const useEffectDebounced = (effect: () => void, deps: any[], delay: number): void => {
  useEffect(() => {
    const handler = setTimeout(() => { effect() }, delay)

    return () => { clearTimeout(handler) }
  }, [...(deps || []), delay])
}
