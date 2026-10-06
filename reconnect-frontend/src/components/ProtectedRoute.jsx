import { Navigate, useLocation } from "react-router-dom";

function isTokenExpired(token) {
  try {
    // JWT is three base64 parts separated by dots — the middle is the payload
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch {
    // If we can't decode it, treat it as expired
    return true;
  }
}

function ProtectedRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem("access_token");

  if (!token || isTokenExpired(token)) {
    // Clean up stale auth data before redirecting
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;