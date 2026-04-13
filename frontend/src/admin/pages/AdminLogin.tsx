import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    // 🔥 MOCK LOGIN (NO BACKEND)

    if (email === "admin@test.com" && password === "123456") {
      const mockData = {
        token: "fake-token",
        user: {
          _id: "1",
          role: "admin",
        },
      };

      login(mockData);
      navigate("/admin");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-xl border"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-xl border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-primary text-white py-3 rounded-xl"
        >
          Login
        </button>
      </div>
    </div>
  );
}