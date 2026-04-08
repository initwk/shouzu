<template>
  <div>
    <el-card>
      <template #header><span style="font-weight:bold">系统设置</span></template>
      <el-form :model="form" label-width="130px" style="max-width:600px">
        <el-form-item label="默认水价(元/吨)">
          <el-input-number v-model="form.default_water_price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="默认电价(元/度)">
          <el-input-number v-model="form.default_electric_price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="默认公摊系数">
          <el-input-number v-model="form.default_share_coefficient" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="提醒天数">
          <el-input v-model="form.reminder_days" placeholder="如：3,1,0 表示到期前3天、1天、当天提醒" />
        </el-form-item>
        <el-form-item label="滞纳金费率(%/天)">
          <el-input-number v-model="form.late_fee_rate" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 退房结算 -->
    <el-card style="margin-top:20px">
      <template #header><span style="font-weight:bold">退房结算</span></template>
      <el-form :model="checkoutForm" label-width="130px" style="max-width:600px">
        <el-form-item label="选择房源" required>
          <el-select v-model="checkoutForm.house_id" placeholder="请选择已租房源" style="width:100%" @change="onCheckoutHouseChange">
            <el-option v-for="h in rentedHouses" :key="h.id" :label="`${h.community_name} - ${h.house_no}`" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="退房日期" required>
          <el-date-picker v-model="checkoutForm.check_out_time" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="扣减费用">
          <el-input-number v-model="checkoutForm.deduct_fee" :min="0" :precision="2" />
          <span style="color:#909399;margin-left:10px">保洁、损坏等扣减</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="checkoutForm.remark" type="textarea" />
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="handleCheckout" :loading="checkoutLoading">确认退房结算</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const form = ref({
  default_water_price: 5, default_electric_price: 1,
  default_share_coefficient: 1, reminder_days: '3,1,0', late_fee_rate: 0
})
const saving = ref(false)
const rentedHouses = ref([])
const checkoutLoading = ref(false)
const checkoutForm = ref({ house_id: '', check_out_time: '', deduct_fee: 0, remark: '' })

const loadData = async () => {
  const res = await request.get('/setting/detail', { params: { user_id: user.id } })
  if (res.data.code === 200 && res.data.data) {
    form.value = res.data.data
  }
}

const loadRentedHouses = async () => {
  const res = await request.get('/house/list', { params: { user_id: user.id, house_status: 1 } })
  if (res.data.code === 200) rentedHouses.value = res.data.data
}

const onCheckoutHouseChange = (houseId) => {
  // 自动填入当前租客
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = await request.post('/setting/update', { ...form.value, user_id: user.id })
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.data.msg)
    }
  } finally {
    saving.value = false
  }
}

const handleCheckout = async () => {
  if (!checkoutForm.value.house_id || !checkoutForm.value.check_out_time) {
    return ElMessage.warning('请选择房源和退房日期')
  }
  const house = rentedHouses.value.find(h => h.id === checkoutForm.value.house_id)
  if (!house || !house.current_tenant_id) {
    return ElMessage.warning('该房源没有绑定租客')
  }
  await ElMessageBox.confirm('退房结算后，租客将被删除，房源变为空置，未缴账单将标记为已缴。确认继续？', '退房确认', { type: 'warning' })
  checkoutLoading.value = true
  try {
    const res = await request.post('/checkout/settle', {
      ...checkoutForm.value,
      user_id: user.id,
      tenant_id: house.current_tenant_id
    })
    if (res.data.code === 200) {
      ElMessage.success(`退房结算成功，应退押金：${res.data.data.refundFee} 元`)
      checkoutForm.value = { house_id: '', check_out_time: '', deduct_fee: 0, remark: '' }
      loadRentedHouses()
    } else {
      ElMessage.error(res.data.msg)
    }
  } finally {
    checkoutLoading.value = false
  }
}

onMounted(() => { loadData(); loadRentedHouses() })
</script>
