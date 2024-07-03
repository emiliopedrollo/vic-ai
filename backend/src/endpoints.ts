import dotenv from "dotenv";
import axios, { AxiosRequestConfig } from 'axios'
dotenv.config()

export async function request (options: {
  endpoint: string,
  query?: object,
  params?: object|any
  method?: "get" | "post" | "put" | "delete"
  auth: string,
  body?: object|Array<any>
  options?: AxiosRequestConfig
}) {

  const url: string = `https://${process.env['COWMED_API_URL']}/` + (() => {

    const prefix = `api/farm/${options.params?.farm}`

    switch(options.endpoint) {

      case 'user-info': return `api/user-info`
      case 'farm-info': return `${prefix}`

      case 'list-units': return `${prefix}/unit/datatable`

      case 'list-animals': return `${prefix}/animal/datatable`
      case 'store-animal': return `${prefix}/animal`
      case 'update-animal': return `${prefix}/animal/${options.params?.animal}`
      case 'move-animals': return `${prefix}/animal/move-many`

      case 'list-batches': return `${prefix}/batch/datatable`
      case 'store-batch': return `${prefix}/batch`

      case 'list-infirmary': return `${prefix}/event/datatable/health/group`
      case 'list-heats': return `${prefix}/event/datatable/reproduction/heat`
    }
    throw "endpoint not defined"
  })()

  return axios.request({
    url,
    params: options.query,
    method: options.method,
    data: options.body,
    ...options.options,
    headers: {
      Authorization: `Bearer ${options.auth}`,
      Accept: 'application/json',
      ...options.options?.headers || {}
    }
  })

}
