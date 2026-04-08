<template>
  <el-container style="height: 100vh">
    <!-- 左侧侧边栏 -->
    <el-aside width="220px" style="background: #304156">
      <div class="logo">房东收租系统</div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/house">
          <el-icon><House /></el-icon>
          <span>房源管理</span>
        </el-menu-item>
        <el-menu-item index="/tenant">
          <el-icon><User /></el-icon>
          <span>租客管理</span>
        </el-menu-item>
        <el-menu-item index="/bill">
          <el-icon><Document /></el-icon>
          <span>账单管理</span>
        </el-menu-item>
        <el-menu-item index="/meter">
          <el-icon><Memo /></el-icon>
          <span>抄表管理</span>
        </el-menu-item>
        <el-menu-item index="/reminder">
          <el-icon><Bell /></el-icon>
          <span>催租提醒</span>
        </el-menu-item>
        <el-menu-item index="/contract">
          <el-icon><Tickets /></el-icon>
          <span>合同管理</span>
        </el-menu-item>
        <el-menu-item index="/finance">
          <el-icon><TrendCharts /></el-icon>
          <span>财务统计</span>
        </el-menu-item>
        <el-menu-item index="/setting">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header style="background:#fff;border-bottom:1px solid #e6e6e6;display:flex;align-items:center;justify-content:space-between;padding:0 20px">
        <span style="font-size:16px;font-weight:600">{{ $route.meta.title || '仪表盘' }}</span>
        <div style="display:flex;align-items:center;gap:15px">
          <span style="color:#666">{{ user.nickname || user.username }}</span>
          <el-button type="danger" size="small" @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main style="background:#f5f5f5;padding:20px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Odometer, House, User, Document, Memo, Bell, Tickets, TrendCharts, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))

const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background: #263445;
}
.el-menu {
  border-right: none;
}
</style>
