import { httpRequest } from './http';

export const vehiclesService = {
  list: () => httpRequest('/vehicles'),
  create: (payload) =>
    httpRequest('/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    httpRequest(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    httpRequest(`/vehicles/${id}`, {
      method: 'DELETE',
    }),
};
