<template>
  <div>
    <!-- 筛选 -->
    <el-card style="margin-bottom:15px">
      <el-row :gutter="10" align="middle">
        <el-col :span="6">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="loadData" />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 收入汇总 -->
    <el-row :gutter="20" style="margin-bottom:20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#67C23A">{{ summary.totalIncome }}</div>
            <div style="color:#909399;margin-top:5px">总收入（已缴费）</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#E6A23C">{{ summary.totalUnpaid }}</div>
            <div style="color:#909399;margin-top:5px">待收金额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#409EFF">{{ summary.paidCount }}</div>
            <div style="color:#909399;margin-top:5px">已缴笔数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#F56C6C">{{ summary.unpaidCount }}</div>
            <div style="color:#909399;margin-top:5px">未缴笔数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 缴费明细 -->
    <el-card>
      <template #header><span style="font-weight:bold">缴费明细</span></template>
      <el-table :data="bills" stripe border>
        <el-table-column prop="bill_month" label="月份" width="90" />
        <el-table-column prop="tenant_name" label="租客" width="80" />
        <el-table-column prop="house_no" label="房号" width="120" />
        <el-table-column prop="rent" label="租金" width="80" />
        <el-table-column prop="water_fee" label="水费" width="70" />
        <el-table-column prop="electric_fee" label="电费" width="70" />
        <el-table-column prop="other_fee" label="其他" width="70" />
        <el-table-column prop="late_fee" label="滞纳金" width="70" />
        <el-table-column prop="total_fee" label="总金额" width="90" />
        <el-table-column prop="bill_status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.bill_status === 1 ? 'success' : 'warning'">
              {{ row.bill_status === 1 ? '已缴费' : '未缴费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_time" label="缴费时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../utils/request'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const bills = ref([])
const dateRange = ref([])

const summary = computed(() => {
  const paid = bills.value.filter(b => b.bill_status === 1)
  const unpaid = bills.value.filter(b => b.bill_status === 0)
  return {
    totalIncome: paid.reduce((s, b) => s + parseFloat(b.total_fee || 0), 0).toFixed(2),
    totalUnpaid: unpaid.reduce((s, b) => s + parseFloat(b.total_fee || 0), 0).toFixed(2),
    paidCount: paid.length,
    unpaidCount: unpaid.length
  }
})

const loadData = async () => {
  const res = await request.get('/bill/list', {
    params: { user_id: user.id }
  })
  if (res.data.code === 200) {
    let data = res.data.data
    if (dateRange.value && dateRange.value.length === 2) {
      data = data.filter(b => b.due_date >= dateRange.value[0] && b.due_date <= dateRange.value[1])
    }
    bills.value = data
  }
}

onMounted(loadData)
</script>
