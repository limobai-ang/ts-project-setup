<template>
    <div class="register-container">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
            <el-form-item label="用户名" prop="name">
                <el-input v-model="form.name" placeholder="请输入用户名"></el-input>
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
            </el-form-item>

            <el-form-item label="密码" prop="password">
                <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password></el-input>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password></el-input>
            </el-form-item>

            <el-form-item>
                <div class="btn-rows">
                    <div>
                        <el-button type="primary" @click="onSubmit">注册</el-button>
                        <el-button @click="onReset">重置</el-button>
                    </div>
                    <div>
                        <el-button type="primary" link @click="toLogin">
                            返回登陆
                        </el-button>
                    </div>
                </div>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { addUser } from '@/apis/auth'
import { RegisterForm } from "@/apis/auth/types";
import { useRouter } from 'vue-router';

const router = useRouter()
// 表单数据
const form = reactive<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
})
// 表单引用
const formRef = ref<FormInstance>()

// 表单验证规则
const rules: FormRules = {
    name: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, message: '用户名长度至少为3个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== form.password) {
                    callback(new Error('两次输入的密码不一致'))
                } else {
                    callback()
                }
            }, trigger: 'blur'
        }
    ]
}

// 提交表单
const onSubmit = () => {
    formRef.value?.validate((valid) => {
        if (valid) {
            // 在此处执行注册逻辑，例如发送数据到后端
            addUser(form).then(res => {
                ElMessage({
                    message: '用户添加成功！',
                    type: 'success',
                })

                toLogin()
            })
        } else {
            ElMessage.error('请检查输入内容')
        }
    })
}

// 重置表单
const onReset = () => {
    formRef.value?.resetFields()
}

// 返回登陆页面
const toLogin = () => {
    router.push({
        path: '/login'
    })
}
</script>

<style scoped>
.register-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.btn-rows {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}
</style>