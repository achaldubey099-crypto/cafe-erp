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
  if (role && (!user || user.role !== role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}