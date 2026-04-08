<template>
  <div v-loading="loading">
    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom:20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background:#409EFF"><el-icon :size="28"><House /></el-icon></div>
            <div>
              <div class="stat-value">{{ stats.houseStats?.total || 0 }} 套</div>
              <div class="stat-label">总房源</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background:#67C23A"><el-icon :size="28"><User /></el-icon></div>
            <div>
              <div class="stat-value">在租 {{ stats.houseStats?.rented || 0 }} / 空置 {{ stats.houseStats?.vacant || 0 }}</div>
              <div class="stat-label">房源状态</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background:#E6A23C"><el-icon :size="28"><Bell /></el-icon></div>
            <div>
              <div class="stat-value">{{ stats.todayDue || 0 }} 笔</div>
              <div class="stat-label">今日到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background:#F56C6C"><el-icon :size="28"><TrendCharts /></el-icon></div>
            <div>
              <div class="stat-value">{{ stats.monthIncome || 0 }} 元</div>
              <div class="stat-label">本月收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 待缴账单 -->
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight:bold">待缴账单</span></template>
          <el-table :data="stats.unpaidBills" size="small" max-height="300" v-if="stats.unpaidBills?.length">
            <el-table-column prop="tenant_name" label="租客" width="80" />
            <el-table-column prop="house_no" label="房号" width="120" />
            <el-table-column prop="total_fee" label="金额" width="80">
              <template #default="{ row }">{{ row.total_fee }} 元</template>
            </el-table-column>
            <el-table-column prop="due_date" label="到期日" />
          </el-table>
          <el-empty v-else description="暂无待缴账单" :image-size="60" />
        </el-card>
      </el-col>
      <!-- 即将到期合同 -->
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight:bold">即将到期合同（30天内）</span></template>
          <el-table :data="stats.expiringContracts" size="small" max-height="300" v-if="stats.expiringContracts?.length">
            <el-table-column prop="tenant_name" label="租客" width="80" />
            <el-table-column prop="house_no" label="房号" width="120" />
            <el-table-column prop="contract_end_time" label="到期日" />
          </el-table>
          <el-empty v-else description="暂无即将到期合同" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { House, User, Bell, TrendCharts } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUser } from '../composables/useUser'

const user = useUser()
const stats = ref({})
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/dashboard/stats', { params: { user_id: user.id } })
    if (res.data.code === 200) {
      stats.value = res.data.data
    }
  } catch {
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stat-card { display: flex; align-items: center; gap: 15px; }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; }
.stat-value { font-size: 18px; font-weight: bold; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
