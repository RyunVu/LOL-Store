import apiClient from './client'

export const authApi = {
  login: (credentials) =>
    apiClient.post('/account/login', {
      userName: credentials.identifier,
      password: credentials.password,
    }).then(res => res.data),

  register: (userData) =>
    apiClient.post('/account/register', {
      userName: userData.userName,
      email: userData.email,
      password: userData.password,
    }).then(res => res.data),

  logout: () =>
    apiClient.get('/account/logout').then(res => res.data),

  refreshToken: () =>
    apiClient.get('/account/refreshToken').then(res => res.data),

  getUsers: () =>
    apiClient.get('/account/getUsers').then(res => res.data),

  getRoles: () =>
    apiClient.get('/account/roles').then(res => res.data),

  changePassword: (passwordData) =>
    apiClient.put('/account/changePassword', passwordData).then(res => res.data),

  updateUserRoles: (roleData) =>
    apiClient.put('/account/updateUserRoles', roleData).then(res => res.data),
}
