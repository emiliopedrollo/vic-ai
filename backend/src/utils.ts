import { setTimeout } from "timers/promises"

export async function sleep (milliseconds: number): Promise<void> {

  return new Promise(resolve => {
    setTimeout(milliseconds).then(resolve)
  })

}

export function compareObjectsWithCallbacks (obj1: any, obj2: any, options: {
  onRemove?: { (key: string, value: any, path: string): boolean|undefined }
  onModified?: { (key: string, old_value: any, new_value: any, path: string): boolean|undefined }
  onAdded?: { (key: string, value: any, path: string): boolean|undefined }
}) {
  let diff: any = {};

  const onRemove = options.onRemove || (() => undefined)
  const onModified = options.onModified || (() => undefined)
  const onAdded = options.onAdded || (() => undefined)

  const compare = (obj1: any, obj2: any, path = '') => {
    for (let key in obj1) {
      const fullPath = path ? `${path}.${key}` : key;
      if (obj2[key] === undefined) {
        if (onRemove(key, obj1[key], fullPath) !== false) {
          diff[fullPath] = { value: obj1[key], change: 'removed' };
        }
      } else if (obj1[key] !== obj2[key]) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          compare(obj1[key], obj2[key], fullPath);
        } else if (onModified(key, obj1[key], obj2[key], fullPath) !== false) {
          diff[fullPath] = { oldValue: obj1[key], newValue: obj2[key], change: 'modified' };
        }
      }
    }
    for (let key in obj2) {
      const fullPath = path ? `${path}.${key}` : key;
      if ((obj1[key] === undefined) && (onAdded(key, obj2[key], fullPath) !== false)) {
        diff[fullPath] = { value: obj2[key], change: 'added' };
      }
    }
  }

  compare(obj1, obj2);
  return diff;
}



export function getInseminationMethod (service_method?: string) : string|undefined {
  switch (service_method) {
    case 'insemination': return 'reproduction.inseminated'
    case 'embryo_transfer': return 'reproduction.embryo_transfer'
    case 'natural_breeding': return 'reproduction.natural_breeding'
  }
}

export function changeTimezone (date: Date, timezone: string) {
  const local_date = new Date(date.toLocaleString('en-US', {
    timeZone: timezone
  }));
  const diff = date.getTime() - local_date.getTime();
  return new Date(date.getTime() - diff);

}


export function getRequestFormatedDate(date?: Date|string): string | undefined {
  if (date === undefined) {
    return undefined
  }

  date = date instanceof Date ? date : new Date(date)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based, so add 1
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
export function getRequestFormatedTimestamp(date?: Date|string): string | undefined {
  if (date === undefined) {
    return undefined
  }

  console.log(date)
  date = date instanceof Date ? date : new Date(date)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based, so add 1
  const day = String(date.getDate()).padStart(2, '0')
  const hour = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const seconds = date.getUTCSeconds()

  const formatted = `${year}-${month}-${day} ${hour}:${minutes}:${seconds}-0000`

  console.log('FORMATTED DATE', formatted)

  return formatted
}
