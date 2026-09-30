import { apiFetch } from './api';

export const adminApi = {
  setUserRole: (userId: string, role: string) =>
    apiFetch(`/v1/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  createCity: (name: string) =>
    apiFetch('/v1/cities', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCity: (cityId: string) => apiFetch(`/v1/cities/${cityId}`, { method: 'DELETE' }),
  createPost: (input: { content: string; visibility: string; location: string; authorName?: string }) =>
    apiFetch('/v1/posts', { method: 'POST', body: JSON.stringify(input) }),
  deletePost: (postId: string) => apiFetch(`/v1/posts/${postId}`, { method: 'DELETE' }),
  createShop: (input: Record<string, unknown>) =>
    apiFetch('/v1/shops', { method: 'POST', body: JSON.stringify(input) }),
  deleteShop: (shopId: string) => apiFetch(`/v1/shops/${shopId}`, { method: 'DELETE' }),
  createJob: (input: Record<string, unknown>) =>
    apiFetch('/v1/jobs', { method: 'POST', body: JSON.stringify(input) }),
  setJobStatus: (jobId: string, status: 'active' | 'closed') =>
    apiFetch(`/v1/jobs/${jobId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteJob: (jobId: string) => apiFetch(`/v1/jobs/${jobId}`, { method: 'DELETE' }),
  setBannerStatus: (bannerId: string, status: 'approved' | 'rejected') =>
    apiFetch(`/v1/banners/${bannerId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteBanner: (bannerId: string) => apiFetch(`/v1/banners/${bannerId}`, { method: 'DELETE' }),
  resolveReport: (reportId: string, deletePost = false) =>
    apiFetch(`/v1/reports/${reportId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ deletePost }),
    }),
  sendMessage: (roomId: string, text: string, authorName?: string) =>
    apiFetch(`/v1/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, authorName }),
    }),
  deleteMessage: (roomId: string, messageId: string) =>
    apiFetch(`/v1/chat/rooms/${roomId}/messages/${messageId}`, { method: 'DELETE' }),
};
