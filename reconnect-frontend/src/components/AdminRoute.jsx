import { Navigate, useLocation } from "react-router-dom";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function AdminRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("access_token");
  const userData = localStorage.getItem("user");

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!userData) {
    return <Navigate to="/dashboard" replace />;
  }

  try {
    const user = JSON.parse(userData);

    if (user.role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (error) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
}

export default AdminRoute;
