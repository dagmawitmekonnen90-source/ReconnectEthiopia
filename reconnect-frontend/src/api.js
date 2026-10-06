/**
 * Central API base URL.
 * In development this reads from .env as VITE_API_BASE=http://127.0.0.1:5000
 * In production set VITE_API_BASE to your deployed backend URL in Vercel dashboard.
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default API_BASE;
