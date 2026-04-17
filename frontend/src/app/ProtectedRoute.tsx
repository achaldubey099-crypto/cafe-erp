import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: Array<"admin" | "owner" | "superadmin" | "user">;
}) {
  const { user, customer } = useAuth();

  const isCustomerRoute = roles?.length === 1 && roles[0] === "user";
  const token = isCustomerRoute
    ? localStorage.getItem("customerToken")
    : localStorage.getItem("token");

  // Check if token literally says "undefined" or "null" (can happen with bad JS serialization)
  if (!token || token === "undefined" || token === "null") {
    // Clear bad data if any
    if (!isCustomerRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } else {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customerUser");
    }
    return <Navigate to={isCustomerRoute ? "/login" : "/admin/login"} replace />;
  }

  // 🛡️ Role-based protection
  if (roles?.length) {
    const activeUser = isCustomerRoute ? customer : user;

    if (!activeUser) {
      // If there's a token but the context hasn't hydrated user...
      // Check if user is even in localStorage to hydrate from
      const storedKey = isCustomerRoute ? "customerUser" : "user";
      const storedUser = localStorage.getItem(storedKey);
      
      if (!storedUser || storedUser === "undefined" || storedUser === "null") {
        // Unrecoverable state: token exists but user data is gone or corrupted
        localStorage.removeItem(isCustomerRoute ? "customerToken" : "token");
        localStorage.removeItem(storedKey);
        return <Navigate to={isCustomerRoute ? "/login" : "/admin/login"} replace />;
      }
      
      return null; // Let auth context hydrate from localStorage
    }

    if (!roles.includes(activeUser.role)) {
      return <Navigate to={isCustomerRoute ? "/login" : "/admin/login"} replace />;
    }
  }

  return children;
}
