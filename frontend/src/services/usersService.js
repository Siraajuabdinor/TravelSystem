import { httpRequest } from './http'

export const usersService = {
  list: () => httpRequest('/users'),
  create: (payload) =>
    httpRequest('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
}
