import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "admin" | "customer";
}) {
  const { user } = useAuth();

  const token = localStorage.getItem("token");

  // 🔐 Not logged in
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // 🛡️ Role-based protection
  // If we have a token but user isn't loaded yet, wait (avoid redirecting to `/` on refresh)
  if (role) {
    if (!user) {
      return null; // let auth context hydrate from localStorage
    }

    if (user.role !== role) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}