import axios from 'axios'

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5132/api',
  withCredentials: true, 
})

export default refreshClient
