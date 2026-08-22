/**
 * API Client Module
 * Handles HTTP requests, JWT token header attachment, and 401 redirect dispatching.
 */

import { getToken, clearSession } from './auth.js';

const API_BASE_URL = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);

    // Handle 401 Unauthorized (Expired or invalid token)
    if (res.status === 401 && !options.skipAuthRedirect) {
      clearSession();
      window.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data?.error?.message || `Request failed with status ${res.status}`);
      error.code = data?.error?.code || 'API_ERROR';
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth endpoints (Pillar A)
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  // User Profile endpoints (Pillar A)
  getMe: () => request('/users/me'),
  updateMe: (body) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),

  // Trips endpoints (Pillar B contract)
  getTrips: () => request('/trips'),
  createTrip: (body) => request('/trips', { method: 'POST', body: JSON.stringify(body) }),
  getTripById: (id) => request(`/trips/${id}`),
  updateTrip: (id, body) => request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),

  // Stops & Activities (Pillar B)
  addStop: (tripId, body) => request(`/trips/${tripId}/stops`, { method: 'POST', body: JSON.stringify(body) }),

  // Discovery (Pillar C contract)
  getCities: (query = '', region = '') => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (region) params.set('region', region);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/cities${qs}`, { skipAuth: true });
  },
  getCityActivities: (cityId, category = '') => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/cities/${cityId}/activities${qs}`, { skipAuth: true });
  },

  // Share & Copy (Pillar C)
  shareTrip: (tripId) => request(`/trips/${tripId}/share`, { method: 'POST' }),
  copyTrip: (shareToken) => request(`/trips/${shareToken}/copy`, { method: 'POST' }),
  getPublicTrip: (shareToken) => request(`/public/trips/${shareToken}`, { skipAuth: true })
};
