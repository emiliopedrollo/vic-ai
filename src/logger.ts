

export const VERBOSITY_DEBUG = 5
export const VERBOSITY_LOG = 4
export const VERBOSITY_INFO = 3
export const VERBOSITY_WARN = 2
export const VERBOSITY_ERROR = 1
export const VERBOSITY_NONE = 0

export function logger(
  type: "log" | "info" | "warn" | "error" | "debug",
  ...data: any
) {
  switch (type) {
    case "debug": debug (...data); break
    case "log":   log   (...data); break
    case "info":  info  (...data); break
    case "warn":  warn  (...data); break
    case "error": error (...data); break
  }
}

const getLogVerbosity = (): number => parseInt(import.meta.env.VITE_LOG_VERBOSITY || '3')

export function debug(...data: any) {
  if (getLogVerbosity() >= VERBOSITY_DEBUG) {
    console.debug(...data)
  }
}

export function log(...data: any) {
  if (getLogVerbosity() >= VERBOSITY_LOG) {
    console.log(...data)
  }
}
export function info(...data: any) {
  if (getLogVerbosity() >= VERBOSITY_INFO) {
    console.info(...data)
  }
}

export function warn(...data: any) {
  if (getLogVerbosity() >= VERBOSITY_WARN) {
    console.warn(...data)
  }
}

export function error(...data: any) {
  if (getLogVerbosity() >= VERBOSITY_ERROR) {
    console.error(...data)
  }
}

export function group(options: {
  data: any,
  collapsed?: boolean,
  verbosity?: number
}|string) {

  if (typeof options === "string") {
    options = { data : options }
  }

  if (getLogVerbosity() >= (options.verbosity || VERBOSITY_INFO)) {
    if (
      ((options.collapsed !== undefined) && options.collapsed) || // if present test its value
      (options.collapsed === undefined)                           // otherwise pass check
    ) {
      console.groupCollapsed(options.data)
    } else {
      console.group(options.data)
    }
  }
}

export function groupEnd(verbosity?: number){
  if (getLogVerbosity() >= (verbosity || VERBOSITY_INFO)) {
    console.groupEnd()
  }
}

export function table(data: any, properties?: string[], verbosity?: number) {
  if (getLogVerbosity() >= (verbosity || VERBOSITY_INFO)) {
    console.table(data, properties)
  }
}
