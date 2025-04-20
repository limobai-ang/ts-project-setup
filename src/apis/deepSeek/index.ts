import request from "@/utils/request";
import { AxiosPromise } from "axios";

// 请求deepseek
export function searchAI(data: object): AxiosPromise<string> {
    return request({
      method: 'post',
      url: `/deepSeek/search`,
      data
    });
  }

// 语音识别
export function voiceToText(data: FormData): AxiosPromise<string> {
  return request({
    method: 'post',
    url: `/upload/voice`,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000, // 设置超时时间为 60 秒
    data
  });
}