// 定义登录表单的接口
export interface LoginForm {
    username: string;
    password: string;
}

// 登录响应类型
export interface LoginResponse {
    token: string;
    success: boolean;
}