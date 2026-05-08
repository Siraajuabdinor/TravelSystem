import { httpRequest } from './http'

export const vehicleDriversService = {
  list: () => httpRequest('/vehicle-drivers'),
  create: (payload) =>
    httpRequest('/vehicle-drivers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/vehicle-drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/vehicle-drivers/${id}`, {
      method: 'DELETE',
    }),
}
