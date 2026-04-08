<template>
  <div>
    <!-- 搜索栏 -->
    <el-card style="margin-bottom:15px">
      <el-row :gutter="10" align="middle">
        <el-col :span="6">
          <el-input v-model="keyword" placeholder="搜索租客姓名/手机号" clearable @clear="loadData" />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table :data="pagedList" stripe border>
        <el-table-column prop="tenant_name" label="租客姓名" width="100" />
        <el-table-column prop="tenant_phone" label="手机号" width="130" />
        <el-table-column prop="community_name" label="小区" />
        <el-table-column prop="house_no" label="房号" width="130" />
        <el-table-column prop="check_in_time" label="入住日期" width="110" />
        <el-table-column prop="contract_end_time" label="合同到期" width="110" />
        <el-table-column prop="deposit" label="押金(元)" width="90" />
        <el-table-column label="合同状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.contract_end_time)">
              {{ getStatusText(row.contract_end_time) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">{{ getDaysLeft(row.contract_end_time) }} 天</template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, prev, pager, next, sizes" :total="list.length" v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" style="margin-top:15px;justify-content:flex-end" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../utils/request'
import { useUser } from '../composables/useUser'

const user = useUser()
const list = ref([])
const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const pagedList = computed(() => list.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))

const loadData = async () => {
  try {
    const res = await request.get('/tenant/list', {
      params: { user_id: user.id, keyword: keyword.value }
    })
    if (res.data.code === 200) list.value = res.data.data
  } catch {}
}

const getDaysLeft = (endDate) => {
  if (!endDate) return '-'
  const diff = new Date(endDate) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getStatusType = (endDate) => {
  const days = getDaysLeft(endDate)
  if (days < 0) return 'danger'
  if (days <= 30) return 'warning'
  return 'success'
}

const getStatusText = (endDate) => {
  const days = getDaysLeft(endDate)
  if (days < 0) return '已过期'
  if (days <= 30) return '即将到期'
  return '正常'
}

onMounted(loadData)
</script>
