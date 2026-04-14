import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "admin" | "user";
}) {
  const { user, customer } = useAuth();

  const token = role === "user"
    ? localStorage.getItem("customerToken")
    : localStorage.getItem("token");

  // 🔐 Not logged in
  if (!token) {
    return <Navigate to={role === "user" ? "/login" : "/admin/login"} replace />;
  }

  // 🛡️ Role-based protection
  // If we have a token but user isn't loaded yet, wait (avoid redirecting to `/` on refresh)
  if (role) {
    const activeUser = role === "user" ? customer : user;

    if (!activeUser) {
      return null; // let auth context hydrate from localStorage
    }

    if (activeUser.role !== role) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
