import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface User {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  customer: User | null;
  isCustomerLoggedIn: boolean;
  login: (data: any) => void;
  loginCustomer: (data: any) => void;
  logout: () => void;
  logoutCustomer: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    const storedCustomer = localStorage.getItem("customerUser");
    if (storedCustomer) setCustomer(JSON.parse(storedCustomer));
  }, []);

  const login = useCallback((data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const loginCustomer = useCallback((data: any) => {
    localStorage.setItem("customerToken", data.token);
    localStorage.setItem("customerUser", JSON.stringify(data.user));
    setCustomer(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const logoutCustomer = useCallback(() => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    localStorage.removeItem("cart");
    setCustomer(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        isCustomerLoggedIn: !!customer && !!localStorage.getItem("customerToken"),
        login,
        loginCustomer,
        logout,
        logoutCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext not found");
  return context;
};
