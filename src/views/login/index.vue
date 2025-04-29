<template>
  <div class="login-container">

    <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px" class="login-form">
      <el-form-item label="用户名" prop="name">
        <el-input v-model="loginForm.name" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
      </el-form-item>
      <el-form-item>
        <div class="btn-rows">
          <div>
            <el-button type="primary" @click="submitForm">登录</el-button>
            <el-button @click="resetForm">重置</el-button>
          </div>
          <div>
            <el-button type="primary" link @click="toRegister">注册用户</el-button>
          </div>
        </div>

      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { userLogin } from '@/apis/auth'

// import { getUserInfo } from '@/apis/user'
import { useRouter } from 'vue-router';
import { useAppStore } from '@/store/app'


// import { useUserStore } from '@/store/user'; // 引入 Pinia Store

const router = useRouter()
const appStore = useAppStore();

// 定义表单数据
const loginForm = reactive({
  name: '',
  password: '',
});

// 表单验证规则
const rules = {
  name: [
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
          getUserInfoFn()
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

// 获取用户信息
const getUserInfoFn = () => {
  const userStore = useUserStore(); // 获取 Store 实例
  getUserInfo().then(res => {
    userStore.setUserInfo(res.data); // 将用户信息存储到 Pinia
  })
}

// 重置表单
const resetForm = () => {
  loginFormRef.value?.resetFields();
};

const toRegister = () => {
  router.push({
    path: '/register'
  })
}
</script>

<style scoped>
.login-container {
  width: 360px;
  padding: 40px 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #fff;
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

}

.login-form {
  margin-top: 20px;
}

.btn-rows {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
