<template>
  <div>
    <!-- 搜索栏 -->
    <el-card style="margin-bottom:15px">
      <el-row :gutter="10" align="middle">
        <el-col :span="5">
          <el-input v-model="keyword" placeholder="搜索小区/房号/租客" clearable @clear="loadData" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="billStatus" placeholder="缴费状态" clearable @change="loadData">
            <el-option label="未缴费" :value="0" />
            <el-option label="已缴费" :value="1" />
            <el-option label="逾期" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-date-picker v-model="billMonth" type="month" placeholder="账单月份" value-format="YYYY-MM" @change="loadData" />
        </el-col>
        <el-col :span="3">
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-col>
        <el-col :span="8" style="text-align:right">
          <el-button type="warning" @click="calcLateFee">计算滞纳金</el-button>
          <el-button type="success" @click="openGenerateDialog()">生成账单</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table :data="pagedList" stripe border>
        <el-table-column prop="bill_month" label="月份" width="90" />
        <el-table-column prop="tenant_name" label="租客" width="80" />
        <el-table-column prop="house_no" label="房号" width="120" />
        <el-table-column prop="rent" label="租金" width="80" />
        <el-table-column prop="water_fee" label="水费" width="80" />
        <el-table-column prop="electric_fee" label="电费" width="80" />
        <el-table-column prop="other_fee" label="其他" width="70" />
        <el-table-column prop="late_fee" label="滞纳金" width="70" />
        <el-table-column prop="total_fee" label="总金额" width="90">
          <template #default="{ row }"><b style="color:#F56C6C">{{ row.total_fee }}</b></template>
        </el-table-column>
        <el-table-column prop="due_date" label="到期日" width="110" />
        <el-table-column prop="bill_status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusType(row.bill_status)">
              {{ statusText(row.bill_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.bill_status !== 1" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-if="row.bill_status === 0 || row.bill_status === 2" size="small" type="success" @click="openPayDialog(row)">标记缴费</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :total="list.length"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        style="margin-top:15px;text-align:right"
      />
    </el-card>

    <!-- 生成账单弹窗 -->
    <el-dialog v-model="genDialogVisible" title="生成账单" width="550px">
      <el-form :model="genForm" label-width="100px">
        <el-form-item label="选择房源" required>
          <el-select v-model="genForm.house_id" placeholder="请选择房源" style="width:100%" @change="onHouseChange">
            <el-option v-for="h in rentedHouses" :key="h.id" :label="`${h.community_name} - ${h.house_no}`" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="账单月份" required>
          <el-date-picker v-model="genForm.bill_month" type="month" value-format="YYYY-MM" style="width:100%" />
        </el-form-item>
        <el-form-item label="月租金">
          <el-input-number v-model="genForm.rent" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="其他费用">
          <el-input-number v-model="genForm.other_fee" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="到期日期" required>
          <el-date-picker v-model="genForm.due_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate" :loading="saving">生成账单</el-button>
      </template>
    </el-dialog>

    <!-- 标记缴费弹窗 -->
    <el-dialog v-model="payDialogVisible" title="标记已缴费" width="450px">
      <el-form :model="payForm" label-width="100px">
        <el-form-item label="缴费方式" required>
          <el-select v-model="payForm.payment_type" style="width:100%">
            <el-option label="微信" :value="1" />
            <el-option label="支付宝" :value="2" />
            <el-option label="银行卡" :value="3" />
            <el-option label="现金" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="payForm.payment_remark" placeholder="如：微信转账单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePay" :loading="saving">确认缴费</el-button>
      </template>
    </el-dialog>

    <!-- 编辑账单弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑账单" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="月租金">
          <el-input-number v-model="editForm.rent" :min="0" :precision="2" style="width:100%" @change="calcEditTotal" />
        </el-form-item>
        <el-form-item label="水费">
          <el-input-number v-model="editForm.water_fee" :min="0" :precision="2" style="width:100%" @change="calcEditTotal" />
        </el-form-item>
        <el-form-item label="电费">
          <el-input-number v-model="editForm.electric_fee" :min="0" :precision="2" style="width:100%" @change="calcEditTotal" />
        </el-form-item>
        <el-form-item label="其他费用">
          <el-input-number v-model="editForm.other_fee" :min="0" :precision="2" style="width:100%" @change="calcEditTotal" />
        </el-form-item>
        <el-form-item label="滞纳金">
          <el-input-number v-model="editForm.late_fee" :min="0" :precision="2" style="width:100%" @change="calcEditTotal" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="editForm.due_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="总金额">
          <span style="font-size:20px;font-weight:bold;color:#F56C6C">{{ editForm.total_fee }} 元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSave" :loading="saving">保存</el-button>
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
const billStatus = ref('')
const billMonth = ref('')
const genDialogVisible = ref(false)
const payDialogVisible = ref(false)
const editDialogVisible = ref(false)
const saving = ref(false)
const rentedHouses = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const genForm = ref({ house_id: '', bill_month: '', rent: 0, other_fee: 0, due_date: '' })
const payForm = ref({ id: '', payment_type: 1, payment_remark: '' })
const editForm = ref({ id: '', rent: 0, water_fee: 0, electric_fee: 0, other_fee: 0, late_fee: 0, total_fee: 0, due_date: '' })

const statusText = (s) => ({ 0: '未缴费', 1: '已缴费', 2: '逾期' })[s] || '未知'
const statusType = (s) => ({ 0: 'warning', 1: 'success', 2: 'danger' })[s] || 'info'

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return list.value.slice(start, start + pageSize.value)
})

const loadData = async () => {
  try {
    const res = await request.get('/bill/list', {
      params: { user_id: user.id, keyword: keyword.value, bill_status: billStatus.value, bill_month: billMonth.value }
    })
    if (res.data.code === 200) list.value = res.data.data
  } catch (e) {
    ElMessage.error('加载账单列表失败')
  }
}

const loadRentedHouses = async () => {
  try {
    const res = await request.get('/house/list', { params: { user_id: user.id, house_status: 1 } })
    if (res.data.code === 200) rentedHouses.value = res.data.data
  } catch (e) {
    ElMessage.error('加载房源列表失败')
  }
}

const onHouseChange = (houseId) => {
  const house = rentedHouses.value.find(h => h.id === houseId)
  if (house) genForm.value.rent = house.rent_price
}

const openGenerateDialog = async () => {
  genForm.value = { house_id: '', bill_month: '', rent: 0, other_fee: 0, due_date: '' }
  try {
    await loadRentedHouses()
  } catch (e) {
    ElMessage.error('加载房源失败')
    return
  }
  genDialogVisible.value = true
}

const handleGenerate = async () => {
  if (!genForm.value.house_id || !genForm.value.bill_month || !genForm.value.due_date) {
    return ElMessage.warning('请填写必填项')
  }
  // 获取该房源当前租客
  const house = rentedHouses.value.find(h => h.id === genForm.value.house_id)
  if (!house || !house.current_tenant_id) {
    return ElMessage.warning('该房源没有绑定租客')
  }
  saving.value = true
  try {
    const res = await request.post('/bill/generate', {
      ...genForm.value,
      user_id: user.id,
      tenant_id: house.current_tenant_id
    })
    if (res.data.code === 200) {
      ElMessage.success('账单生成成功')
      genDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    ElMessage.error('生成账单失败')
  } finally {
    saving.value = false
  }
}

const openPayDialog = (row) => {
  payForm.value = { id: row.id, payment_type: 1, payment_remark: '' }
  payDialogVisible.value = true
}

const handlePay = async () => {
  saving.value = true
  try {
    const res = await request.post('/bill/pay', payForm.value)
    if (res.data.code === 200) {
      ElMessage.success('标记成功')
      payDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    ElMessage.error('标记缴费失败')
  } finally {
    saving.value = false
  }
}

const openEditDialog = (row) => {
  editForm.value = {
    id: row.id,
    rent: Number(row.rent) || 0,
    water_fee: Number(row.water_fee) || 0,
    electric_fee: Number(row.electric_fee) || 0,
    other_fee: Number(row.other_fee) || 0,
    late_fee: Number(row.late_fee) || 0,
    total_fee: Number(row.total_fee) || 0,
    due_date: row.due_date
  }
  editDialogVisible.value = true
}

const calcEditTotal = () => {
  const f = editForm.value
  f.total_fee = Number((f.rent + f.water_fee + f.electric_fee + f.other_fee + f.late_fee).toFixed(2))
}

const handleEditSave = async () => {
  saving.value = true
  try {
    const res = await request.post('/bill/update', editForm.value)
    if (res.data.code === 200) {
      ElMessage.success('修改成功')
      editDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    ElMessage.error('修改失败')
  } finally {
    saving.value = false
  }
}

const calcLateFee = async () => {
  try {
    await ElMessageBox.confirm('将根据系统设置中的滞纳金费率，自动计算所有逾期账单的滞纳金并更新状态。确认继续？', '计算滞纳金', { type: 'info' })
  } catch { return }
  try {
    const res = await request.post('/bill/calc-late-fee', { user_id: user.id })
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      loadData()
    }
  } catch (e) {
    ElMessage.error('计算滞纳金失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该账单？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    const res = await request.post('/bill/delete', { id: row.id })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    ElMessage.error('删除账单失败')
  }
}

onMounted(loadData)
</script>
