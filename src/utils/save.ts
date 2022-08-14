import { exportTimingData, exportPerformaceData } from "../types/timing"

export function saveToStorage (data: exportTimingData | exportPerformaceData | Record<string, number>, key: string) {
  const storeData = JSON.parse(localStorage.getItem(key) || '{}')
  localStorage.setItem(key, JSON.stringify(Object.assign(storeData, data)))
}