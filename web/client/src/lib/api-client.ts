import { apiGet, apiPost, apiPut, apiDelete } from './api';

// Lightweight client wrapper to mimic axios-style interface
const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};

export default apiClient;
