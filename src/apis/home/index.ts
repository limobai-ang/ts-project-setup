import request from "@/utils/request";
import { AxiosPromise } from "axios";

// 上传文件
export function uploadFileWorld(formData: FormData): AxiosPromise<Boolean> {
    return request({
      method: 'post',
      headers: {
        'Content-Type': 'multipart/form-data' 
      },
      url: `/upload/worldFile`,
      data: formData, // 传递 FormData 对象
    });
  }