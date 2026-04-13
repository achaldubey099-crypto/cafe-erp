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

  if (role === "admin" && !user) {
  return <Navigate to="/admin-login" />;
    }

  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
}