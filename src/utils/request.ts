import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAppStore } from '@/store/app'
import { storeToRefs } from 'pinia'
const appStore = useAppStore();
const { token, isLoggedIn } = storeToRefs(appStore);

// 创建 axios 实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 设置 token
    if (token.value) {
      config.headers['X-Token'] = token.value;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message } = response.data;
    if (code == '200') {
      return response.data;
    } else if (code == '401') {
      ElMessageBox.confirm('当前页面已失效，请重新登录', '提示', {
        confirmButtonText: '确定',
        type: 'warning'
      }).then(() => {
        localStorage.clear();
        window.location.href = '/';
      });
    } else {
      ElMessage.error(message)
      return Promise.reject(new Error(message || '系统错误'));
    }
  },
  (error: any) => {
    return Promise.reject(error.message);
  }
);

// 导出 axios 实例
export default service;
