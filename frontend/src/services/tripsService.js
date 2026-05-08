import { httpRequest } from './http'

export const tripsService = {
  list: () => httpRequest('/trips'),
  create: (payload) =>
    httpRequest('/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/trips/${id}`, {
      method: 'DELETE',
    }),
}
