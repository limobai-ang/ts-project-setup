<template>
  <div class="user">
    <el-form :model="form" label-width="auto" style="max-width: 600px">
      <el-form-item label="Activity name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Activity zone">
        <el-select v-model="form.region" placeholder="please select your zone">
          <el-option label="shanghai" value="shanghai" />
          <el-option label="beijing" value="beijing" />
        </el-select>
      </el-form-item>
      <el-form-item label="Activity time">
        <el-date-picker v-model="form.date1" type="date" placeholder="Pick a date" />
      </el-form-item>
      <el-form-item label="Instant delivery">
        <el-switch v-model="form.delivery" />
      </el-form-item>
      <el-form-item label="Activity type">
        <el-checkbox-group v-model="form.type">
          <el-checkbox label="Online" name="type">
            Online activities
          </el-checkbox>
          <el-checkbox label="Promotion" name="type">
            Promotion activities
          </el-checkbox>
          <el-checkbox label="Offline" name="type">
            Offline activities
          </el-checkbox>
          <el-checkbox label="Simple" name="type">
            Simple brand exposure
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="Resources">
        <el-radio-group v-model="form.resource">
          <el-radio value="Sponsor">Sponsor</el-radio>
          <el-radio value="Venue">Venue</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Activity form">
        <el-input v-model="form.desc" type="textarea" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Create</el-button>
        <el-button>Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment';
import { reactive } from 'vue'
import { addUser } from '@/apis/user'
import { UserWithoutId } from '@/apis/user/types'
const form = reactive<UserWithoutId>({
  name: '',
  region: 'shanghai',
  date1: moment().format("YYYY-MM-DD HH:mm:ss"),
  delivery: false,
  type: ['Online'],
  resource: 'Sponsor',
  desc: '',
})

const onSubmit = () => {
  addUser(form).then(res => {
    console.log(res, '提交成功');

  })
}
</script>

<style lang="scss" scoped></style>