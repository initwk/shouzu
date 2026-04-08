<template>
  <div>
    <!-- 搜索栏 -->
    <el-card style="margin-bottom:15px">
      <el-row :gutter="10" align="middle">
        <el-col :span="6">
          <el-input v-model="keyword" placeholder="搜索小区/房号" clearable @clear="loadData" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="houseStatus" placeholder="房源状态" clearable @change="loadData">
            <el-option label="空置" :value="0" />
            <el-option label="已租" :value="1" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-col>
        <el-col :span="10" style="text-align:right">
          <el-button type="success" @click="openDialog()">新增房源</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table :data="list" stripe border>
        <el-table-column prop="community_name" label="小区名称" />
        <el-table-column prop="house_no" label="楼栋房号" />
        <el-table-column prop="area" label="面积(㎡)" width="90" />
        <el-table-column prop="house_type" label="户型" width="100" />
        <el-table-column prop="rent_price" label="月租(元)" width="90" />
        <el-table-column prop="water_price" label="水价(元/吨)" width="100" />
        <el-table-column prop="electric_price" label="电价(元/度)" width="110" />
        <el-table-column prop="house_status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.house_status === 1 ? 'success' : 'info'">
              {{ row.house_status === 1 ? '已租' : '空置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tenant_name" label="当前租客" width="100">
          <template #default="{ row }">{{ row.tenant_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑房源' : '新增房源'" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="小区名称" required>
          <el-input v-model="form.community_name" placeholder="如：幸福花园" />
        </el-form-item>
        <el-form-item label="楼栋房号" required>
          <el-input v-model="form.house_no" placeholder="如：1栋2单元301" />
        </el-form-item>
        <el-form-item label="面积(㎡)">
          <el-input-number v-model="form.area" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="户型">
          <el-input v-model="form.house_type" placeholder="如：两室一厅" />
        </el-form-item>
        <el-form-item label="月租金(元)" required>
          <el-input-number v-model="form.rent_price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="水价(元/吨)" required>
          <el-input-number v-model="form.water_price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="电价(元/度)" required>
          <el-input-number v-model="form.electric_price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="公摊系数">
          <el-input-number v-model="form.share_coefficient" :min="0" :precision="2" :step="0.1" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const list = ref([])
const keyword = ref('')
const houseStatus = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const form = ref({})

const defaultForm = () => ({
  community_name: '', house_no: '', area: 0, house_type: '',
  rent_price: 0, water_price: 5, electric_price: 1, share_coefficient: 1
})

const loadData = async () => {
  const res = await request.get('/house/list', {
    params: { user_id: user.id, keyword: keyword.value, house_status: houseStatus.value }
  })
  if (res.data.code === 200) list.value = res.data.data
}

const openDialog = (row) => {
  form.value = row ? { ...row } : defaultForm()
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.value.community_name || !form.value.house_no) {
    return ElMessage.warning('请填写小区名称和房号')
  }
  saving.value = true
  try {
    const url = form.value.id ? '/house/update' : '/house/add'
    const params = form.value.id ? form.value : { ...form.value, user_id: user.id }
    const res = await request.post(url, params)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data.msg)
    }
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确认删除该房源？', '提示', { type: 'warning' })
  const res = await request.post('/house/delete', { id: row.id })
  if (res.data.code === 200) {
    ElMessage.success('删除成功')
    loadData()
  } else {
    ElMessage.error(res.data.msg)
  }
}

onMounted(loadData)
</script>
