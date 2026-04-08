import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'house', name: 'House', component: () => import('../views/House.vue'), meta: { title: '房源管理' } },
      { path: 'tenant', name: 'Tenant', component: () => import('../views/Tenant.vue'), meta: { title: '租客管理' } },
      { path: 'bill', name: 'Bill', component: () => import('../views/Bill.vue'), meta: { title: '账单管理' } },
      { path: 'meter', name: 'Meter', component: () => import('../views/Meter.vue'), meta: { title: '抄表管理' } },
      { path: 'reminder', name: 'Reminder', component: () => import('../views/Reminder.vue'), meta: { title: '催租提醒' } },
      { path: 'contract', name: 'Contract', component: () => import('../views/Contract.vue'), meta: { title: '合同管理' } },
      { path: 'finance', name: 'Finance', component: () => import('../views/Finance.vue'), meta: { title: '财务统计' } },
      { path: 'setting', name: 'Setting', component: () => import('../views/Setting.vue'), meta: { title: '系统设置' } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    next()
  } else {
    const user = localStorage.getItem('user')
    if (!user) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
