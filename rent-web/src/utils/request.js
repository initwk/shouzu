import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => response,
  error => {
    ElMessage.error('网络错误，请检查后端服务')
    return Promise.reject(error)
  }
)

export default request
