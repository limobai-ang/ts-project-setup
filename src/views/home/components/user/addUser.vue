<template>
  <div class="user">
    <el-form :model="form" label-width="auto" ref="ruleFormRef" :rules="rules" style="max-width: 600px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="地区" prop="region">
        <el-select v-model="form.region" placeholder="please select your zone">
          <el-option label="上海" value="shanghai" />
          <el-option label="北京" value="beijing" />
        </el-select>
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="form.gender">
          <el-radio value="male">男</el-radio>
          <el-radio value="female">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="出生日期" prop="birthData">
        <el-date-picker v-model="form.birthData" type="date" placeholder="Pick a date" />
      </el-form-item>
      <el-form-item label="是否已婚" prop="delivery">
        <el-switch v-model="form.delivery" />
      </el-form-item>
      <el-form-item label="个人情况" prop="personalSituation">
        <el-checkbox-group v-model="form.personalSituation">
          <el-checkbox v-for="item in personalSituationlist" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item prop="email" label="电子邮箱">
        <el-input v-model="form.email" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.desc" type="textarea" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit(ruleFormRef)">提交</el-button>
        <el-button @click="resetForm(ruleFormRef)">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment';
import { reactive, ref } from 'vue'
import { addUser } from '@/apis/user'
import { UserWithoutId } from '@/apis/user/types'
import type { ComponentSize, FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
const personalSituationlist = ref([
  { label: '车子', value: 'vehicle' },
  { label: '房子', value: 'house' },
  { label: '钞票', value: 'money' },
  { label: '强健的身体', value: 'strongBody' }
])

const rules = reactive<FormRules<UserWithoutId>>({
  name: [
    { required: true, message: 'Please input Activity name', trigger: 'blur' },
    { min: 2, max: 8, message: 'Length should be 2 to 8', trigger: 'blur' },
  ],
  region: [
    {
      required: true,
      message: 'Please select Activity region',
      trigger: 'change',
    },
  ],
  birthData: [
    {
      type: 'date',
      required: true,
      message: 'Please pick a date',
      trigger: 'change',
    },
  ],
  personalSituation: [
    {
      type: 'array',
      required: true,
      message: 'Please select at least one activity personalSituation',
      trigger: 'change',
    },
  ],
  email: [
    {
      required: true,
      message: 'Please input email address',
      trigger: 'blur',
    },
    {
      type: 'email',
      message: 'Please input correct email address',
      trigger: ['blur', 'change'],
    },
  ]
})
const form = reactive<UserWithoutId>({
  name: '',
  region: 'shanghai',
  birthData: moment().format("YYYY-MM-DD"),
  delivery: false,
  personalSituation: [],
  gender: 'male',
  email: '',
  desc: '',
})

const ruleFormRef = ref<FormInstance>()
const onSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      addUser(form).then(res => {
        ElMessage({
          message: '用户添加成功！',
          type: 'success',
        })
      })
    } else {
      console.log('error submit!', fields)
    }
  })
}


const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>

<style lang="scss" scoped></style>