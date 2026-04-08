<template>
  <div class="login-box">
    <el-card class="login-card">
      <h2 style="text-align:center;margin-bottom:30px;color:#303133;font-size:22px">房东收租管理系统</h2>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" @submit.prevent="handleLogin">
            <el-form-item>
              <el-input v-model="loginForm.username" placeholder="请输入账号（手机号/邮箱）" :prefix-icon="User" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-button type="primary" style="width:100%" @click="handleLogin" :loading="loading">登录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="regForm" @submit.prevent="handleRegister">
            <el-form-item>
              <el-input v-model="regForm.username" placeholder="请输入账号" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="regForm.password" type="password" placeholder="请输入密码（至少6位）" show-password />
            </el-form-item>
            <el-form-item>
              <el-input v-model="regForm.confirmPassword" type="password" placeholder="请确认密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-input v-model="regForm.nickname" placeholder="昵称（选填）" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="regForm.phone" placeholder="手机号（选填）" />
            </el-form-item>
            <el-button type="primary" style="width:100%" @click="handleRegister" :loading="loading">注册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const activeTab = ref('login')
const loading = ref(false)
const loginForm = ref({ username: '', password: '' })
const regForm = ref({ username: '', password: '', confirmPassword: '', nickname: '', phone: '' })

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    return ElMessage.warning('请输入账号和密码')
  }
  loading.value = true
  try {
    const res = await request.post('/user/login', loginForm.value)
    if (res.data.code === 200) {
      ElMessage.success('登录成功')
      localStorage.setItem('user', JSON.stringify(res.data.data))
      router.push('/dashboard')
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch { /* 网络错误已由拦截器处理 */ } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!regForm.value.username || !regForm.value.password) {
    return ElMessage.warning('请输入账号和密码')
  }
  if (regForm.value.password.length < 6) {
    return ElMessage.warning('密码至少6位')
  }
  if (regForm.value.password !== regForm.value.confirmPassword) {
    return ElMessage.warning('两次密码不一致')
  }
  loading.value = true
  try {
    const { confirmPassword, ...postData } = regForm.value
    const res = await request.post('/user/register', postData)
    if (res.data.code === 200) {
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
      loginForm.value.username = regForm.value.username
      regForm.value = { username: '', password: '', confirmPassword: '', nickname: '', phone: '' }
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch { /* 网络错误已由拦截器处理 */ } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-box { display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { width: 420px; padding: 10px; border-radius: 8px; }
</style>
