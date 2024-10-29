<template>
  <div class="login-container">
    <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px" class="login-form">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">登录</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { userLogin } from '@/apis/auth'
import { useRouter } from 'vue-router';
import { useAppStore } from '@/store/app'
import { storeToRefs } from 'pinia'
const router = useRouter()
const appStore = useAppStore();

// 定义表单数据
const loginForm = reactive({
  username: '',
  password: '',
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
};

// 引用表单
const loginFormRef = ref();

// 提交表单
const submitForm = () => {
  loginFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      userLogin(loginForm).then(res => {

        if (res.data.success) {
          // 保存tokne 
          appStore.setToken(res.data.token)
          ElMessage({
            message: '登陆成功',
            type: 'success',
          })

          router.push({
            path: '/home'
          })
        } else {
          ElMessage({
            message: '登陆失败',
            type: 'error',
          })
        }

      }).catch(err => {
        console.log(err);

      })

      // 这里可以添加登录的 API 请求逻辑
    } else {
      ElMessage.error('请完善表单');
    }
  });
};

// 重置表单
const resetForm = () => {
  loginFormRef.value?.resetFields();
};
</script>

<style scoped>
.login-container {
  width: 360px;
  margin: 100px auto;
  padding: 40px 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #fff;
}

.login-form {
  margin-top: 20px;
}
</style>
