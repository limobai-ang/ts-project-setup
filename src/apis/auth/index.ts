import request from "@/utils/request";
import { AxiosPromise } from "axios";
import { LoginForm, LoginResponse } from './types'
// 用户登陆
export function userLogin(data: LoginForm): AxiosPromise<LoginResponse> {
    return request({
        method: 'post',
        url: `/auth/login`,
        data
    })
}

// 注销登陆
