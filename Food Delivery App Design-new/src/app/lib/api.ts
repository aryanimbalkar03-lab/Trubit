/**
 * Trubit Core API & Session Manager
 * 
 * This module handles all backend communication, automatically manages 
 * secure session IDs, and attaches auth headers to every request.
 */

// Generate a random session ID if one doesn't exist
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// In a real mobile app, we'd use Capacitor Preferences for secure storage.
// Using localStorage as a fallback.
function getSessionId() {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('trubit_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('trubit_session_id', sessionId);
  }
  return sessionId;
}

// Ensure session exists immediately on load
const currentSession = getSessionId();

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.trubit.app/v1';

export type APIError = {
  message: string;
  code: number;
};

/**
 * Core fetch wrapper that intercepts every request to inject the Session ID.
 */
export async function trubitFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Inject JSON content type by default
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // 🔥 Inject Backend Session & Auth Tokens 🔥
  headers.set('X-Session-ID', currentSession);
  
  const token = localStorage.getItem('trubit_auth_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle token refresh if API tells us our session expired (401)
    if (response.status === 401) {
      console.warn("Session expired. Need to refresh token or re-authenticate.");
      // Emit global event to trigger logout/refresh UI
      window.dispatchEvent(new CustomEvent('trubit:auth:expired'));
      throw { message: 'Session Expired', code: 401 };
    }

    // Attempt to parse JSON
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw { message: data.message || 'API Request Failed', code: response.status };
    }

    return data as T;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Example usage for backend integration:
 * 
 * export async function getRestaurants() {
 *   return await trubitFetch('/restaurants');
 * }
 * 
 * export async function placeOrder(orderPayload) {
 *   return await trubitFetch('/orders', {
 *     method: 'POST',
 *     body: JSON.stringify(orderPayload)
 *   });
 * }
 */
