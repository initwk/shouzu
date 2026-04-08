import { reactive } from 'vue'

export function useUser() {
  let parsed = {}
  try {
    parsed = JSON.parse(localStorage.getItem('user') || '{}')
  } catch (e) {
    localStorage.removeItem('user')
  }
  const user = reactive(parsed)
  return user
}
