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

  // Check if token literally says "undefined" or "null" (can happen with bad JS serialization)
  if (!token || token === "undefined" || token === "null") {
    // Clear bad data if any
    if (role === "admin") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } else {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customerUser");
    }
    return <Navigate to={role === "user" ? "/login" : "/admin/login"} replace />;
  }

  // 🛡️ Role-based protection
  if (role) {
    const activeUser = role === "user" ? customer : user;

    if (!activeUser) {
      // If there's a token but the context hasn't hydrated user...
      // Check if user is even in localStorage to hydrate from
      const storedKey = role === "user" ? "customerUser" : "user";
      const storedUser = localStorage.getItem(storedKey);
      
      if (!storedUser || storedUser === "undefined" || storedUser === "null") {
        // Unrecoverable state: token exists but user data is gone or corrupted
        localStorage.removeItem(role === "user" ? "customerToken" : "token");
        localStorage.removeItem(storedKey);
        return <Navigate to={role === "user" ? "/login" : "/admin/login"} replace />;
      }
      
      return null; // Let auth context hydrate from localStorage
    }

    if (activeUser.role !== role) {
      return <Navigate to={role === "user" ? "/login" : "/admin/login"} replace />;
    }
  }

  return children;
}
