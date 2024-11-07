import request from "@/utils/request";
import { AxiosPromise } from "axios";
import { LoginForm, LoginResponse, RegisterForm } from './types'
// 用户登陆
export function userLogin(data: LoginForm): AxiosPromise<LoginResponse> {
    return request({
        method: 'post',
        url: `/auth/login`,
        data
    })
}


// 注册用户
export function addUser(data: RegisterForm ): AxiosPromise<Boolean> {
    return request({
        method: 'post',
        url: `/auth/addUser`,
        data
    })
}
