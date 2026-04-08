<template>
  <div>
    <el-card style="margin-bottom:15px">
      <el-row :gutter="10" align="middle">
        <el-col :span="4">
          <el-button type="success" @click="openDialog()">新增模板</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-table :data="list" stripe border>
        <el-table-column prop="template_name" label="模板名称" />
        <el-table-column prop="template_content" label="模板内容" show-overflow-tooltip />
        <el-table-column prop="reminder_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ ['到期前提醒', '到期当天提醒', '逾期提醒'][row.reminder_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="primary" @click="openRenderDialog(row)">生成催租</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="row.user_id === 0">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 模板编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="form.template_name" />
        </el-form-item>
        <el-form-item label="提醒类型">
          <el-select v-model="form.reminder_type" style="width:100%">
            <el-option label="到期前提醒" :value="0" />
            <el-option label="到期当天提醒" :value="1" />
            <el-option label="逾期提醒" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容" required>
          <el-input v-model="form.template_content" type="textarea" :rows="5" />
          <div style="color:#909399;font-size:12px;margin-top:4px">
            支持占位符：{tenant_name}、{house_no}、{total_fee}、{due_date}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 生成催租内容弹窗 -->
    <el-dialog v-model="renderDialogVisible" title="生成催租内容" width="550px">
      <el-form label-width="100px">
        <el-form-item label="选择租客">
          <el-select v-model="renderTenantId" placeholder="请选择租客" style="width:100%">
            <el-option v-for="t in tenants" :key="t.id" :label="`${t.tenant_name} - ${t.house_no || ''}`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleRender" style="margin-left:100px;margin-bottom:15px">生成</el-button>
        <el-form-item label="催租内容" v-if="renderContent">
          <el-input v-model="renderContent" type="textarea" :rows="5" />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUser } from '../composables/useUser'

const user = useUser()
const list = ref([])
const tenants = ref([])
const dialogVisible = ref(false)
const renderDialogVisible = ref(false)
const saving = ref(false)
const form = ref({})
const currentTemplateId = ref('')
const renderTenantId = ref('')
const renderContent = ref('')

const loadData = async () => {
  try {
    const res = await request.get('/reminder/list', { params: { user_id: user.id } })
    if (res.data.code === 200) list.value = res.data.data
  } catch (e) {
    ElMessage.error('加载模板列表失败')
  }
}

const loadTenants = async () => {
  try {
    const res = await request.get('/tenant/list', { params: { user_id: user.id } })
    if (res.data.code === 200) tenants.value = res.data.data
  } catch (e) {
    ElMessage.error('加载租客列表失败')
  }
}

const openDialog = (row) => {
  form.value = row ? { ...row } : { template_name: '', template_content: '', reminder_type: 0 }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.value.template_name || !form.value.template_content) {
    return ElMessage.warning('请填写模板名称和内容')
  }
  saving.value = true
  try {
    const url = form.value.id ? '/reminder/update' : '/reminder/add'
    const params = form.value.id ? form.value : { ...form.value, user_id: user.id }
    const res = await request.post(url, params)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    ElMessage.error('保存模板失败')
  } finally {
    saving.value = false
  }
}

const openRenderDialog = async (row) => {
  currentTemplateId.value = row.id
  renderContent.value = ''
  renderTenantId.value = ''
  await loadTenants()
  renderDialogVisible.value = true
}

const handleRender = async () => {
  if (!renderTenantId.value) return ElMessage.warning('请选择租客')
  try {
    const res = await request.post('/reminder/render', {
      template_id: currentTemplateId.value,
      tenant_id: renderTenantId.value
    })
    if (res.data.code === 200) {
      renderContent.value = res.data.data.content
    }
  } catch (e) {
    ElMessage.error('生成催租内容失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该模板？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    const res = await request.post('/reminder/delete', { id: row.id })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    ElMessage.error('删除模板失败')
  }
}

onMounted(loadData)
</script>
