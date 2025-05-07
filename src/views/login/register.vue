<!-- The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work. -->
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <el-card class="max-w-md w-full">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold text-gray-900">用户注册</h2>
        <p class="mt-2 text-sm text-gray-600">创建您的账号，开始您的旅程</p>
      </div>
      <el-form class="mt-8" :model="form" :rules="rules" ref="formRef" label-position="top"
        @submit.prevent="handleRegister">
        <div class="space-y-4">
          <!-- 用户名 -->
          <el-form-item prop="username" label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <!-- 邮箱 -->
          <el-form-item prop="email" label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱" :prefix-icon="Message">
              <template #append>
                <el-button @click="sendEmailCode" :disabled="emailCodeSending" type="primary" size="small"
                  class="whitespace-nowrap" style="margin: 0;">
                  {{ emailCodeSending ? `${countdown}秒后重新获取` : '获取验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          <!-- 邮箱验证码 -->
          <el-form-item prop="emailCode" label="邮箱验证码">
            <el-input v-model="form.emailCode" placeholder="请输入邮箱验证码" :prefix-icon="Key" />
          </el-form-item>
          <!-- 手机号 -->
          <el-form-item prop="phone" label="手机号">
            <el-input v-model="form.phone" placeholder="请输入手机号" :prefix-icon="Phone" />
          </el-form-item>
          <!-- 密码 -->
          <el-form-item prop="password" label="密码">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
          </el-form-item>
          <!-- 确认密码 -->
          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" :prefix-icon="Lock"
              show-password />
          </el-form-item>
        </div>
        <el-form-item prop="agree">
          <el-checkbox v-model="form.agree">
            我已阅读并同意 <el-link type="primary" href="#">用户协议</el-link> 和 <el-link type="primary" href="#">隐私政策</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" class="w-full" :loading="isSubmitting">
            <el-icon class="mr-2">
              <UserFilled />
            </el-icon>
            {{ isSubmitting ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="text-center mt-4">
        <p class="text-sm text-gray-600">
          已有账号？
          <el-link type="primary" @click="toLogin">立即登录</el-link>
        </p>
      </div>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { User, Message, Phone, Lock, Key, UserFilled } from '@element-plus/icons-vue';
import { addUser, sendCode } from '@/apis/auth'
import { useRouter } from 'vue-router';

const router = useRouter()

interface FormData {
  username: string;
  email: string;
  emailCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

const formRef = ref<FormInstance>();
const form = reactive<FormData>({
  username: '',
  email: '',
  emailCode: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agree: false
});

const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致!'));
  } else {
    callback();
  }
};

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能少于3个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ],
  agree: [
    { type: 'boolean', message: '请同意用户协议和隐私政策', trigger: 'change' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          callback(new Error('请同意用户协议和隐私政策'));
        } else {
          callback();
        }
      }, trigger: 'change'
    }
  ]
});

const isSubmitting = ref(false);
const emailCodeSending = ref(false);
const countdown = ref(60);
// 倒计时函数
const startCountdown = () => {
  if (countdown.value > 0) {
    countdown.value--;
    setTimeout(startCountdown, 1000);
  } else {
    emailCodeSending.value = false;
  }
};
const sendEmailCode = async () => {
  try {
    await formRef.value?.validateField('email');
    emailCodeSending.value = true;
    countdown.value = 60;
    startCountdown();
    // 模拟发送验证码
    await sendCode(form.email)
    ElMessage.success('验证码已发送至您的邮箱，请查收');

  } catch (error) {
    // 邮箱验证失败，不发送验证码
    ElMessage.error('获取验证码失败，请重试')
    emailCodeSending.value = false;
  }
};

const handleRegister = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    isSubmitting.value = true;

    // 在此处执行注册逻辑，例如发送数据到后端
    await addUser(form)
    ElMessage.success('注册成功！');

    // 重置表单
    formRef.value.resetFields();
    toLogin()


  } catch (error) {
    ElMessage.error('请检查表单填写是否正确');
  } finally {
    isSubmitting.value = false;
  }
};

// 返回登陆页面
const toLogin = () => {
  router.push({
    path: '/login'
  })
}
</script>
<style scoped>
.el-form {
  margin-top: 2rem;
}

.el-button {
  margin-top: 1rem;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>