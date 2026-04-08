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
        <el-col :span="14" style="text-align:right">
          <el-button type="success" @click="openDialog()">新增租客</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table :data="pagedList" stripe border>
        <el-table-column prop="tenant_name" label="姓名" width="100" />
        <el-table-column prop="tenant_phone" label="手机号" width="130" />
        <el-table-column prop="id_card" label="身份证" width="180" />
        <el-table-column prop="community_name" label="小区" />
        <el-table-column prop="house_no" label="房号" width="130" />
        <el-table-column prop="check_in_time" label="入住日期" width="110" />
        <el-table-column prop="contract_end_time" label="合同到期" width="110" />
        <el-table-column prop="deposit" label="押金(元)" width="90" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, prev, pager, next, sizes" :total="list.length" v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑租客' : '新增租客'" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="租客姓名" required>
          <el-input v-model="form.tenant_name" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="form.tenant_phone" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="form.id_card" />
        </el-form-item>
        <el-form-item label="绑定房源" required>
          <el-select v-model="form.house_id" placeholder="请选择房源" :disabled="!!form.id" style="width:100%">
            <el-option v-for="h in vacantHouses" :key="h.id" :label="`${h.community_name} - ${h.house_no}`" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="入住日期" required>
          <el-date-picker v-model="form.check_in_time" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="合同到期" required>
          <el-date-picker v-model="form.contract_end_time" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="押金(元)">
          <el-input-number v-model="form.deposit" :min="0" :precision="2" />
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
const keyword = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const form = ref({})
const vacantHouses = ref([])

const defaultForm = () => ({
  tenant_name: '', tenant_phone: '', id_card: '', house_id: '',
  check_in_time: '', contract_end_time: '', deposit: 0
})

const currentPage = ref(1)
const pageSize = ref(10)
const pagedList = computed(() => list.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))

const loadData = async () => {
  try {
    const res = await request.get('/tenant/list', {
      params: { user_id: user.id, keyword: keyword.value }
    })
    if (res.data.code === 200) list.value = res.data.data
  } catch (e) {}
}

const loadVacantHouses = async () => {
  const res = await request.get('/house/vacant', { params: { user_id: user.id } })
  if (res.data.code === 200) vacantHouses.value = res.data.data
}

const openDialog = async (row) => {
  form.value = row ? { ...row } : defaultForm()
  await loadVacantHouses()
  // 编辑时，把当前房源加入可选列表
  if (row && !vacantHouses.value.find(h => h.id === row.house_id)) {
    vacantHouses.value.unshift({ id: row.house_id, community_name: row.community_name, house_no: row.house_no })
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.value.tenant_name || !form.value.tenant_phone || !form.value.house_id) {
    return ElMessage.warning('请填写必填项')
  }
  if (!form.value.check_in_time || !form.value.contract_end_time) {
    return ElMessage.warning('请选择入住日期和合同到期日')
  }
  saving.value = true
  try {
    const url = form.value.id ? '/tenant/update' : '/tenant/add'
    const params = form.value.id ? form.value : { ...form.value, user_id: user.id }
    try {
      const res = await request.post(url, params)
      if (res.data.code === 200) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.data.msg)
      }
    } catch (e) {}
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该租客？关联房源将被释放为空置状态。', '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await request.post('/tenant/delete', { id: row.id })
  if (res.data.code === 200) {
    ElMessage.success('删除成功')
    loadData()
  } else {
    ElMessage.error(res.data.msg)
  }
}

onMounted(loadData)
</script>
