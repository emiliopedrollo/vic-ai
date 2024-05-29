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
    switch(options.endpoint) {
      case 'user-info': return `api/user-info`
      case 'farm-info': return `api/farm/${options.params?.farm}`
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
