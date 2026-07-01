import api from './axiosConfig';

const endpoints = {
  stats: '/api/admin/stats',
  exercises: '/api/exercises',
  rules: '/api/ruledefinitions',
  templates: '/api/workouttemplates',
};

function unwrap(response) {
  return response.data?.data ?? response.data;
}

function preparePayload(item) {
  const payload = { ...item };
  if (!payload.id) delete payload.id;
  return payload;
}

async function list(resource) {
  const response = await api.get(endpoints[resource]);
  return unwrap(response);
}

async function save(resource, item) {
  const payload = preparePayload(item);
  if (item.id) {
    const response = await api.put(`${endpoints[resource]}/${item.id}`, payload);
    return unwrap(response);
  }

  const response = await api.post(endpoints[resource], payload);
  return unwrap(response);
}

async function remove(resource, id) {
  const response = await api.delete(`${endpoints[resource]}/${id}`);
  return unwrap(response);
}

export async function getAdminStats() {
  const response = await api.get(endpoints.stats);
  return unwrap(response);
}

export const adminMasterDataApi = {
  exercises: {
    list: () => list('exercises'),
    save: (item) => save('exercises', item),
    remove: (id) => remove('exercises', id),
  },
  rules: {
    list: () => list('rules'),
    save: (item) => save('rules', item),
    remove: (id) => remove('rules', id),
  },
  templates: {
    list: () => list('templates'),
    save: (item) => save('templates', item),
    remove: (id) => remove('templates', id),
  },
};
