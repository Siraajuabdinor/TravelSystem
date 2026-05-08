import { httpRequest } from './http';

export const citiesService = {
  list: () => httpRequest('/cities'),
  create: (payload) =>
    httpRequest('/cities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/cities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/cities/${id}`, {
      method: 'DELETE',
    }),
};
