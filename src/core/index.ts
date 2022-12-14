import { DefaultOptons, Options, TrackerConfig, MouseEventList, reportTrackerData } from "../types/index";
import { createHistoryEvent } from "../utils/pv";
import { timing } from "../lib/timing";
import FMPTiming from "../lib/fmp";


export default class Tracker {
  public data: Options;

  constructor (options: Options) {
    this.data = Object.assign(this.initDef(), options)
    this.installTracker()
  }

  private initDef(): DefaultOptons {
    window.history['pushState'] = createHistoryEvent('pushState')
    window.history['replaceState'] = createHistoryEvent('replaceState')
    // window.history['back'] = createHistoryEvent('back')
    return <DefaultOptons>{
      sdkVersion: TrackerConfig.version,
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false,
      lazyReport: false,
      timeTracker: false,
    }
  }

  public setUserId <T extends DefaultOptons['uuid']>(id: T): void {
    this.data.uuid = id
  }

  public setExtra <T extends DefaultOptons['extra']>(extra: T): void {
    this.data.extra = extra
  }

  /**
   * 手动上报信息
   * @type reportTrackerData 上传数据类型
   */
  public sendTracker <T extends reportTrackerData>(data: T) {
    this.reportTracker(data)
  }

  private saveTracker <T extends reportTrackerData>(data: T): void {
    const trackerData = localStorage.getItem('tracker') || undefined
    if (trackerData) {
      try {
        let arr: reportTrackerData[] = JSON.parse(trackerData)
        arr = [...arr, data]
        localStorage.setItem('tracker', JSON.stringify(arr))
      } catch (error) {
        console.error('sdk saveTracker error!', error)
      }
    } else {
      localStorage.setItem('tracker', JSON.stringify([data]))
    }
  }

  /**
   * 上报信息到后台
   */
   private reportTracker <T>(data: T) {
    const params = Object.assign(this.data, data, { time: new Date().getTime() })
    let headers = {
      type: 'application/x-www-form-urlencoded'
    }
    let blob = new Blob([JSON.stringify(params)], headers)
    navigator.sendBeacon(this.data.requestUrl, blob)
  }

  /**
   * 上报不带构造对象的信息
   */
  private reportTrackerWithoutConstructor (data: string): void {
    try {
      let headers = {
        type: 'application/x-www-form-urlencoded'
      }
      let blob = new Blob([data], headers)
      navigator.sendBeacon(this.data.requestUrl, blob)
    } catch (error) {
      console.error('sdk reportTrackerData error!', error)
    }
  }

  /**
   * 关闭页面前，上报所有信息到后台
   */
  private reportTrackerArray (): void {
    const trackerData = localStorage.getItem('tracker') || undefined
    if (trackerData) {
      this.reportTrackerWithoutConstructor(trackerData)
      localStorage.removeItem('tracker')
    }
    const timingData = localStorage.getItem('timing') || undefined
    if (timingData) {
      this.reportTrackerWithoutConstructor(timingData)
      localStorage.removeItem('timing')
    }
    const performaceData = localStorage.getItem('performace') || undefined
    if (performaceData) {
      this.reportTrackerWithoutConstructor(performaceData)
      localStorage.removeItem('performace')
    }
  }

  /**
   * 上报DOM点击事件
   */
  private reportDomTracker (): void {
    MouseEventList.forEach(event => {
      window.addEventListener(event, e => {
        const target = e.target as HTMLElement
        const targetKey = target.getAttribute('data-tracker-key')
        if (targetKey) {
          if (this.data.lazyReport) {
            this.saveTracker({
              event,
              targetKey,
              clickData: {
                x: (e as MouseEvent).clientX,
                y: (e as MouseEvent).clientY
              }
            })
            return
          }
          this.sendTracker({
            event,
            targetKey,
            clickData: {
              x: (e as MouseEvent).clientX,
              y: (e as MouseEvent).clientY
            }
          })
        }
      })
    })
  }

  /**
   * js错误
   */
  private jsError (): void {
    this.jsErrorEvent()
    this.promiseErrorEvent()
  }

  /**
   * 捕获js错误
   */
  private jsErrorEvent(): void {
    window.addEventListener('error', e => {
      if (this.isResourseError(e)) return
      if (this.data.lazyReport) {
        this.saveTracker({
          event: 'js-error',
          targetKey: 'js-error',
          data: {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno
          }
        })
        return
      }
      this.sendTracker({
        event: 'js-error',
        targetKey: 'js-error',
        data: {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno
        }
      })
    })
  }

  /**
   * 资源错误
   * @param event 事件对象
   * @returns boolean 是否是资源错误
   */
  private isResourseError (event: ErrorEvent): boolean {
    // if (event.target && (event.target.src || event.target.href))
    const target = event.target || event.srcElement;
    const isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
    if (!isElementTarget) return false;
    if (this.data.lazyReport) {
      this.saveTracker({
        event: 'resource-error',
        targetKey: 'resource-error',
        data: {
          // @ts-ignore
          url: target.src || target.href,
        }
      })
    } else {
      this.sendTracker({
        event: 'resource-error',
        targetKey: 'resource-error',
        data: {
          // @ts-ignore
          url: target.src || target.href,
        }
      })
    }
    return true
  }

  /**
   * 捕获Promise错误
   */
  private promiseErrorEvent (): void {
    window.addEventListener('unhandledrejection', e => {
      e.promise.catch(err => {
        if (this.data.lazyReport) {
          this.saveTracker({
            event: 'promise-error',
            targetKey: 'promise-error',
            data: {
              message: e.reason.message,
              filename: e.reason.stack.split('\n')[0],
              err: err
            }
          })
          return
        }
        this.sendTracker({
          event: 'promise-error',
          targetKey: 'promise-error',
          data: {
            message: e.reason.message,
            filename: e.reason.stack.split('\n')[0],
            err: err
          }
        })
      })
    })
  }

  /**
   * 页面关闭监听器
   */
  private unloadTracker (): void {
    window.addEventListener('beforeunload', e => {
      this.reportTrackerArray()
    })
  }

  /**
   * 监听器函数
   * @param mouseEventList 触发事件
   * @param targetKey 后台枚举值
   * @param data 其他数据
   */
  private captureEvents <T>(mouseEventList: string[], targetKey: string, data?: T): void {
    mouseEventList.forEach(event => {
      window.addEventListener(event, () => {
        console.log('监听到事件:', event)
        if (this.data.lazyReport) {
          this.saveTracker({
            event,
            targetKey,
            data
          })
          return
        }
        this.sendTracker({
          event,
          targetKey,
          data
        })
      })
    })
  }

  /**
   * 安装监听器
   */
  private installTracker (): void {
    new FMPTiming()
    if (this.data.historyTracker) {
      this.captureEvents(['pushState', 'replaceState', 'popstate'], 'history-pv')
    }
    if (this.data.hashTracker) {
      this.captureEvents(['hashchange'], 'hash-pv')
    }
    if (this.data.domTracker) {
      this.reportDomTracker()
    }
    if (this.data.jsError) {
      this.jsError()
    }
    if (this.data.lazyReport) {
      this.unloadTracker()
    }
    if (this.data.timeTracker && this.data.lazyReport) {
      timing()
    }
  }
}
