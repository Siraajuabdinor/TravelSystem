import { httpRequest } from './http'

export const driversService = {
  list: () => httpRequest('/drivers'),
  create: (payload) =>
    httpRequest('/drivers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/drivers/${id}`, {
      method: 'DELETE',
    }),
}
