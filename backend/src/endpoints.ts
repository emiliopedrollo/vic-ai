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
      case 'list-batches': return `${prefix}/batch/datatable`
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
