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

    <!-- 抄表 + 生成账单弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增抄表 & 生成账单" width="700px" :close-on-click-modal="false">
      <el-steps :active="step" align-center style="margin-bottom:20px">
        <el-step title="填写读数" />
        <el-step title="确认账单" />
        <el-step title="完成" />
      </el-steps>

      <!-- 步骤1：填写抄表数据 -->
      <div v-show="step === 0">
        <el-form :model="form" label-width="100px">
          <el-form-item label="选择房源" required>
            <el-select v-model="form.house_id" placeholder="请选择房源" style="width:100%" @change="onHouseChange">
              <el-option v-for="h in rentedHouses" :key="h.id" :label="`${h.community_name} - ${h.house_no}（${h.tenant_name || '无租客'}）`" :value="h.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="抄表日期" required>
            <el-date-picker v-model="form.reading_time" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="上期电表">
                <el-input-number v-model="form.last_electric" :min="0" :precision="2" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="本期电表" required>
                <el-input-number v-model="form.current_electric" :min="0" :precision="2" style="width:100%" @change="calcFee" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="上期水表">
                <el-input-number v-model="form.last_water" :min="0" :precision="2" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="本期水表" required>
                <el-input-number v-model="form.current_water" :min="0" :precision="2" style="width:100%" @change="calcFee" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="抄表人">
            <el-input v-model="form.operator" placeholder="选填" />
          </el-form-item>

          <!-- 实时计算的费用预览 -->
          <div v-if="feePreview.visible" class="fee-preview">
            <div class="fee-preview-title">费用实时计算</div>
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="用电量">{{ feePreview.electricUsage }} 度</el-descriptions-item>
              <el-descriptions-item label="电费">{{ feePreview.electricFee }} 元</el-descriptions-item>
              <el-descriptions-item label="用水量">{{ feePreview.waterUsage }} 吨</el-descriptions-item>
              <el-descriptions-item label="水费">{{ feePreview.waterFee }} 元</el-descriptions-item>
              <el-descriptions-item label="月租金">{{ feePreview.rent }} 元</el-descriptions-item>
              <el-descriptions-item label="水电合计">
                <span style="color:#E6A23C;font-weight:bold">{{ feePreview.utilityTotal }} 元</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-form>
      </div>

      <!-- 步骤2：确认并生成账单 -->
      <div v-show="step === 1">
        <el-alert type="success" :closable="false" style="margin-bottom:15px">
          <template #title>抄表记录已保存成功！请确认以下账单信息后生成账单。</template>
        </el-alert>
        <el-form :model="billForm" label-width="100px">
          <el-form-item label="账单月份" required>
            <el-date-picker v-model="billForm.bill_month" type="month" value-format="YYYY-MM" style="width:100%" />
          </el-form-item>
          <el-form-item label="到期日期" required>
            <el-date-picker v-model="billForm.due_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-descriptions :column="2" border size="default" style="margin-bottom:15px">
            <el-descriptions-item label="租客">{{ billForm.tenant_name }}</el-descriptions-item>
            <el-descriptions-item label="房号">{{ billForm.house_no }}</el-descriptions-item>
            <el-descriptions-item label="月租金">{{ billForm.rent }} 元</el-descriptions-item>
            <el-descriptions-item label="电费">{{ billForm.electric_fee }} 元</el-descriptions-item>
            <el-descriptions-item label="水费">{{ billForm.water_fee }} 元</el-descriptions-item>
            <el-descriptions-item label="其他费用">
              <el-input-number v-model="billForm.other_fee" :min="0" :precision="2" size="small" @change="calcBillTotal" />
            </el-descriptions-item>
          </el-descriptions>
          <el-form-item label="总金额">
            <span style="font-size:22px;font-weight:bold;color:#F56C6C">{{ billForm.total_fee }} 元</span>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤3：完成 -->
      <div v-show="step === 2" style="text-align:center;padding:20px 0">
        <el-icon :size="48" color="#67C23A"><CircleCheck /></el-icon>
        <div style="font-size:18px;margin-top:10px;color:var(--text-primary)">账单已生成！</div>
      </div>

      <template #footer>
        <el-button @click="handleDialogClose">{{ step === 2 ? '关闭' : '取消' }}</el-button>
        <el-button v-if="step === 0" type="primary" @click="saveMeterAndNext" :loading="saving">保存抄表，下一步</el-button>
        <el-button v-if="step === 1" @click="step = 0">上一步</el-button>
        <el-button v-if="step === 1" type="success" @click="generateBill" :loading="billSaving">确认生成账单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUser } from '../composables/useUser'

const user = useUser()
const list = ref([])
const houseId = ref('')
const allHouses = ref([])
const rentedHouses = ref([])
const dialogVisible = ref(false)
const saving = ref(false)
const billSaving = ref(false)
const step = ref(0)
const form = ref({})
const billForm = ref({})
const selectedHouse = ref(null)

const feePreview = ref({ visible: false, electricUsage: 0, electricFee: 0, waterUsage: 0, waterFee: 0, rent: 0, utilityTotal: 0 })

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
  try {
    const res = await request.get('/house/list', { params: { user_id: user.id } })
    if (res.data.code === 200) allHouses.value = res.data.data
  } catch (e) {}
}

const loadRentedHouses = async () => {
  try {
    const res = await request.get('/house/list', { params: { user_id: user.id, house_status: 1 } })
    if (res.data.code === 200) rentedHouses.value = res.data.data
  } catch (e) {}
}

const onHouseChange = async (hid) => {
  // 加载上期读数
  try {
    const res = await request.get('/meter/latest', { params: { house_id: hid } })
    if (res.data.code === 200) {
      form.value.last_electric = res.data.data.current_electric
      form.value.last_water = res.data.data.current_water
    }
  } catch (e) {}
  // 记录选中房源信息
  selectedHouse.value = rentedHouses.value.find(h => h.id === hid) || null
  calcFee()
}

// 实时计算水电费
const calcFee = () => {
  const h = selectedHouse.value
  if (!h) {
    feePreview.value.visible = false
    return
  }
  const electricUsage = Math.max(0, (form.value.current_electric || 0) - (form.value.last_electric || 0))
  const waterUsage = Math.max(0, (form.value.current_water || 0) - (form.value.last_water || 0))
  const share = h.share_coefficient || 1
  const electricFee = Number((electricUsage * h.electric_price * share).toFixed(2))
  const waterFee = Number((waterUsage * h.water_price * share).toFixed(2))
  const rent = Number(h.rent_price) || 0

  feePreview.value = {
    visible: form.value.current_electric > 0 || form.value.current_water > 0,
    electricUsage: electricUsage.toFixed(2),
    electricFee: electricFee.toFixed(2),
    waterUsage: waterUsage.toFixed(2),
    waterFee: waterFee.toFixed(2),
    rent: rent.toFixed(2),
    utilityTotal: Number((electricFee + waterFee).toFixed(2)).toFixed(2)
  }
}

const openDialog = async () => {
  form.value = defaultForm()
  step.value = 0
  feePreview.value.visible = false
  selectedHouse.value = null
  await loadRentedHouses()
  dialogVisible.value = true
}

// 步骤1：保存抄表 → 进入步骤2
const saveMeterAndNext = async () => {
  if (!form.value.house_id || !form.value.reading_time) {
    return ElMessage.warning('请选择房源和抄表日期')
  }
  if (!form.value.current_electric && !form.value.current_water) {
    return ElMessage.warning('请至少填写本期电表或水表读数')
  }
  saving.value = true
  try {
    const res = await request.post('/meter/add', { ...form.value, user_id: user.id })
    if (res.data.code === 200) {
      // 准备账单数据
      const h = selectedHouse.value
      const fp = feePreview.value
      billForm.value = {
        house_id: form.value.house_id,
        tenant_id: h?.current_tenant_id,
        tenant_name: h?.tenant_name || '',
        house_no: h?.house_no || '',
        bill_month: form.value.reading_time.substring(0, 7),
        rent: Number(h?.rent_price || 0),
        electric_fee: Number(fp.electricFee),
        water_fee: Number(fp.waterFee),
        other_fee: 0,
        total_fee: Number((Number(h?.rent_price || 0) + Number(fp.electricFee) + Number(fp.waterFee)).toFixed(2)),
        due_date: ''
      }
      step.value = 1
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {} finally {
    saving.value = false
  }
}

const calcBillTotal = () => {
  const bf = billForm.value
  bf.total_fee = Number((bf.rent + bf.electric_fee + bf.water_fee + (bf.other_fee || 0)).toFixed(2))
}

// 步骤2：生成账单
const generateBill = async () => {
  if (!billForm.value.bill_month || !billForm.value.due_date) {
    return ElMessage.warning('请填写账单月份和到期日期')
  }
  if (!billForm.value.tenant_id) {
    return ElMessage.warning('该房源没有绑定租客，无法生成账单')
  }
  billSaving.value = true
  try {
    const res = await request.post('/bill/generate', {
      user_id: user.id,
      house_id: billForm.value.house_id,
      tenant_id: billForm.value.tenant_id,
      bill_month: billForm.value.bill_month,
      rent: billForm.value.rent,
      other_fee: billForm.value.other_fee || 0,
      due_date: billForm.value.due_date
    })
    if (res.data.code === 200) {
      step.value = 2
      loadData()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {} finally {
    billSaving.value = false
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
  if (step.value === 2) loadData()
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

<style scoped>
.fee-preview {
  margin-top: 15px;
  padding: 15px;
  background: var(--content-bg);
  border-radius: 8px;
  border: 1px dashed var(--border-color);
}
.fee-preview-title {
  font-size: 15px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 10px;
}
</style>
