<template>
  <div>
    <!-- 搜索栏 -->
    <el-card style="margin-bottom:15px">
      <el-row :gutter="10" align="middle">
        <el-col :span="6">
          <el-select v-model="houseId" placeholder="选择房源筛选" clearable @change="loadData" style="width:100%">
            <el-option v-for="h in allHouses" :key="h.id" :label="`${h.community_name} - ${h.house_no}`" :value="h.id" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-col>
        <el-col :span="14" style="text-align:right">
          <el-button type="success" @click="openDialog()">新增抄表</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table :data="pagedList" stripe border>
        <el-table-column prop="community_name" label="小区" />
        <el-table-column prop="house_no" label="房号" width="130" />
        <el-table-column prop="reading_time" label="抄表日期" width="110" />
        <el-table-column prop="last_electric" label="上期电表" width="90" />
        <el-table-column prop="current_electric" label="本期电表" width="90" />
        <el-table-column label="用电量" width="90">
          <template #default="{ row }">{{ Math.max(0, row.current_electric - row.last_electric).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="last_water" label="上期水表" width="90" />
        <el-table-column prop="current_water" label="本期水表" width="90" />
        <el-table-column label="用水量" width="90">
          <template #default="{ row }">{{ Math.max(0, row.current_water - row.last_water).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="抄表人" width="80" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, prev, pager, next, sizes" :total="list.length" v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" />
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增抄表记录" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="选择房源" required>
          <el-select v-model="form.house_id" placeholder="请选择房源" style="width:100%" @change="onHouseChange">
            <el-option v-for="h in allHouses" :key="h.id" :label="`${h.community_name} - ${h.house_no}`" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="抄表日期" required>
          <el-date-picker v-model="form.reading_time" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="上期电表">
          <el-input-number v-model="form.last_electric" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="本期电表" required>
          <el-input-number v-model="form.current_electric" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="上期水表">
          <el-input-number v-model="form.last_water" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="本期水表" required>
          <el-input-number v-model="form.current_water" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="抄表人">
          <el-input v-model="form.operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUser } from '../composables/useUser'

const user = useUser()
const list = ref([])
const houseId = ref('')
const allHouses = ref([])
const dialogVisible = ref(false)
const saving = ref(false)
const form = ref({})

const defaultForm = () => ({
  house_id: '', reading_time: '', last_electric: 0, current_electric: 0, last_water: 0, current_water: 0, operator: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const pagedList = computed(() => list.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))

const loadData = async () => {
  try {
    const res = await request.get('/meter/list', {
      params: { user_id: user.id, house_id: houseId.value }
    })
    if (res.data.code === 200) list.value = res.data.data
  } catch (e) {}
}

const loadHouses = async () => {
  const res = await request.get('/house/list', { params: { user_id: user.id } })
  if (res.data.code === 200) allHouses.value = res.data.data
}

const onHouseChange = async (houseId) => {
  // 自动加载上期读数
  const res = await request.get('/meter/latest', { params: { house_id: houseId } })
  if (res.data.code === 200) {
    form.value.last_electric = res.data.data.current_electric
    form.value.last_water = res.data.data.current_water
  }
}

const openDialog = async () => {
  form.value = defaultForm()
  await loadHouses()
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.value.house_id || !form.value.reading_time) {
    return ElMessage.warning('请填写必填项')
  }
  saving.value = true
  try {
    const res = await request.post('/meter/add', { ...form.value, user_id: user.id })
    if (res.data.code === 200) {
      ElMessage.success('添加成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {} finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该抄表记录？', '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await request.post('/meter/delete', { id: row.id })
  if (res.data.code === 200) {
    ElMessage.success('删除成功')
    loadData()
  }
}

onMounted(() => { loadData(); loadHouses() })
</script>
