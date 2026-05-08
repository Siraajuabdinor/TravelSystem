import { httpRequest } from './http';

export const routesService = {
  list: () => httpRequest('/routes'),
  create: (payload) =>
    httpRequest('/routes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/routes/${id}`, {
      method: 'DELETE',
    }),
};
