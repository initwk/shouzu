<template>
  <el-container style="height: 100vh">
    <!-- 左侧侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">房东收租系统</div>
      <el-menu
        :default-active="$route.path"
        router
        :background-color="sidebarBg"
        :text-color="sidebarText"
        :active-text-color="sidebarActive"
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
      <el-header class="header">
        <span class="header-title">{{ $route.meta.title || '仪表盘' }}</span>
        <div class="header-actions">
          <el-dropdown @command="switchTheme" trigger="click">
            <el-button size="small">
              <el-icon><Brush /></el-icon>
              {{ themeLabel }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="light">经典亮白</el-dropdown-item>
                <el-dropdown-item command="dark">暗夜模式</el-dropdown-item>
                <el-dropdown-item command="green">护眼绿</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span class="user-name">{{ user.nickname || user.username }}</span>
          <el-button type="danger" size="small" @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Odometer, House, User, Document, Memo, Bell, Tickets, TrendCharts, Setting, Brush } from '@element-plus/icons-vue'
import { useUser } from '../composables/useUser'

const router = useRouter()
const user = useUser()

const currentTheme = ref(localStorage.getItem('theme') || 'light')
const themeLabels = { light: '经典亮白', dark: '暗夜模式', green: '护眼绿' }
const themeLabel = computed(() => themeLabels[currentTheme.value])

const sidebarColors = {
  light: { bg: '#304156', text: '#bfcbd9', active: '#409EFF' },
  dark: { bg: '#1a1a2e', text: '#a8b2c1', active: '#4fc3f7' },
  green: { bg: '#2d4a3e', text: '#c8d8cf', active: '#66bb6a' }
}
const sidebarBg = computed(() => sidebarColors[currentTheme.value].bg)
const sidebarText = computed(() => sidebarColors[currentTheme.value].text)
const sidebarActive = computed(() => sidebarColors[currentTheme.value].active)

const switchTheme = (theme) => {
  currentTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', currentTheme.value)
})

const logout = async () => {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
    localStorage.removeItem('user')
    router.push('/login')
  } catch { /* 取消 */ }
}
</script>

<style scoped>
.sidebar {
  background: var(--sidebar-bg);
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background: var(--sidebar-logo-bg);
}
.el-menu {
  border-right: none;
  font-size: 15px;
}
.header {
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  color: var(--text-secondary);
  font-size: 15px;
}
.main-content {
  background: var(--content-bg);
  padding: 20px;
}
</style>
