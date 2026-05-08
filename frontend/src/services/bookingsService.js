import { httpRequest } from './http'

export const bookingsService = {
  list: () => httpRequest('/bookings'),
  create: (payload) =>
    httpRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/bookings/${id}`, {
      method: 'DELETE',
    }),
}
