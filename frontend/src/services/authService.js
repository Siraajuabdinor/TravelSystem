import { httpRequest } from './http'

export const authService = {
  login: (payload) =>
    httpRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => httpRequest('/auth/me'),
}
