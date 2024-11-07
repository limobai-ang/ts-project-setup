import request from "@/utils/request";
import { AxiosPromise } from "axios";

import {User, UserWithoutId} from './types'

// 获取用户列表
export function getUserList(): AxiosPromise<User[]> {
    return request({
        method: 'get',
        url: `/users/userList`,
    })
}

// 注册用户
export function addUser(data: UserWithoutId ): AxiosPromise<Boolean> {
    return request({
        method: 'post',
        url: `/auth/addUser`,
        data
    })
}

// 删除用户
export function delUser(id: string): AxiosPromise<Boolean> {
    return request({
        method: 'delete',
        url: `/users/deleteUser/${id}`
    })
}

// 获取用户信息
export function getUserInfo(): AxiosPromise<User> {
    return request({
        method: 'get',
        url: `/users/userInfo`
    })
}