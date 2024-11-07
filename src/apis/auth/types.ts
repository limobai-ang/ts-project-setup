// 定义登录表单的接口
export interface LoginForm {
    name: string;
    password: string;
}

// 登录响应类型
export interface LoginResponse {
    token: string;
    success: boolean;
}

export interface RegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }