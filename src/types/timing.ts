import { reportTrackerData } from "./index";

/**
 * @connectTime TCP连接耗时
 * @ttfbTime ttfb时间:发出页面请求到接收到应答数据第一个字节所花费的毫秒数
 * @responseTime 响应时间
 * @parseDOMTime 解析DOM时间
 * @domContentLoadedTime DOMContentLoaded事件时间
 * @domContentLoaded DOMContentLoaded时间
 * @loadTime 完整的页面加载时间
 * @parseDNSTime DNS解析时间
 * @domReadyTime DOM准备总时间
 */
export interface TimingData {
  connectTime: number | undefined,
  ttfbTime: number | undefined,
  responseTime: number | undefined,
  parseDOMTime: number | undefined,
  domContentLoadedTime: number | undefined,
  domContentLoaded: number | undefined,
  loadTime: number | undefined,
  parseDNSTime: number | undefined,
  domReadyTime: number | undefined,
}

/**
 * @firstPaint 页面首次渲染时间，即白屏时间
 * @timeToInteractive 首次可交互时间
 * @firstContentfulPaint 首次有内容渲染
 * @firstMeaningfulPaint 首次有意义渲染
 * @largestContentfulPaint 最大可交互内容渲染时间
 */
export interface PerformaceData {
  firstPaint: number | undefined,
  firstContentfulPaint?: number | undefined,
  firstMeaningfulPaint?: number | undefined,
  largestContentfulPaint?: number | undefined,
  timeToInteractive: number | undefined,
}

export enum TimeConfig {
  TimingKey= 'timing',
  PerformanceKey = 'performance',
}

export interface exportTimingData extends reportTrackerData {
  data: TimingData,
}

export interface exportPerformaceData extends reportTrackerData {
  data: PerformaceData,
}
