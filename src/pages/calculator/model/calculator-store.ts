import { useEffect, useState } from 'react'
import {
  defaultUnifiedInput,
  normalizeLoadedInput,
  type UnifiedInputState,
} from './unified-input'

const STORAGE_KEY = 'metalcalc:unified-input.v1'

export function useCalculatorStore() {
  const [input, setInput] = useState<UnifiedInputState>(() => {
    try {
      const persisted = localStorage.getItem(STORAGE_KEY)
      if (persisted) {
        return normalizeLoadedInput(JSON.parse(persisted))
      }
    } catch {
      // Ignore corrupted or legacy payloads and fall back to defaults.
    }

    return defaultUnifiedInput
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
    } catch {
      // Ignore storage quota and private mode failures.
    }
  }, [input])

  const setField = <K extends keyof UnifiedInputState>(key: K, value: UnifiedInputState[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  const setFields = (patch: Partial<UnifiedInputState>) => {
    setInput((prev) => ({ ...prev, ...patch }))
  }

  const resetStore = () => {
    setInput(defaultUnifiedInput)
  }

  return {
    input,
    setField,
    setFields,
    resetStore,
  }
}
