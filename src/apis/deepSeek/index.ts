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