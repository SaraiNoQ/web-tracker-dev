import load from "../utils/load";
import { saveToStorage } from "../utils/save";
import { TimeConfig, exportTimingData, exportPerformaceData } from "../types/timing";

/**
 * 储存页面加载的数据
 */
export function saveTiming(firstContentfulPaint?: number, largestContentfulPaint?: number) {
  // performance.timing: PerformanceTiming 兼容至 IE9
  const {
    fetchStart,
    connectStart,
    connectEnd,
    // requestStart,
    responseStart,
    responseEnd,
    domLoading,
    domInteractive,
    domContentLoadedEventStart,
    domContentLoadedEventEnd,
    loadEventStart,
    domainLookupStart,
    domainLookupEnd,
  } = performance.timing;
  const exportData: exportTimingData = {
    event: 'timing',
    targetKey: 'timing',
    data: {
      connectTime: connectEnd - connectStart,
      ttfbTime: responseStart - fetchStart,
      responseTime: responseEnd - responseStart,
      parseDOMTime: domInteractive - responseEnd,
      domContentLoadedTime: domContentLoadedEventEnd - domContentLoadedEventStart, // domContentLoadedEventEnd – fetchStart
      domContentLoaded: domContentLoadedEventEnd - fetchStart,
      loadTime: loadEventStart - fetchStart,
      parseDNSTime: domainLookupEnd - domainLookupStart,
      domReadyTime: domContentLoadedEventStart - fetchStart,
    }
  }
  const exportPerformaceData: exportPerformaceData = {
    event: 'performace',
    targetKey: 'performace',
    data: {
      firstPaint: Number(performance.getEntriesByName('first-paint')[0].startTime.toFixed(0)) || responseEnd - fetchStart, //responseEnd - fetchStart,
      firstContentfulPaint: firstContentfulPaint || Number(performance.getEntriesByName("first-contentful-paint")[0].startTime),
      timeToInteractive: domInteractive - domLoading,
      largestContentfulPaint
    }
  }
  saveToStorage(exportData, TimeConfig.TimingKey)
  saveToStorage(exportPerformaceData, TimeConfig.PerformanceKey)
}

/**
 * 上报页面加载时间
 */
export function timing() {
  let firstContentfulPaint: Number
  let largestContentfulPaint: Number
  new PerformanceObserver((entryList) => {
    const entry = entryList.getEntriesByName('first-contentful-paint')
    firstContentfulPaint = Math.round(entry[0].startTime)
  }).observe({ type: 'paint', buffered: true })
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    const entry = entries[entries.length - 1]
    largestContentfulPaint = Math.round(entry.startTime)
  }).observe({ type: 'largest-contentful-paint', buffered: true })

  load(() => {
    // 延迟调用
    setTimeout(saveTiming, 2500, firstContentfulPaint, largestContentfulPaint)
  })
}