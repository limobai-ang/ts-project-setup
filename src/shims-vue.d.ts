/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// declare module 'axios' {
//   import { AxiosRequestConfig } from "axios";
//   interface AxiosInstance {
//     (config: AxiosRequestConfig): Promise
//   }

// }