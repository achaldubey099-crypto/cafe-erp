import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../lib/api";
import LoginCaptcha from "../components/LoginCaptcha";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaRefreshNonce, setCaptchaRefreshNonce] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.post<{ token: string; user: { id: string; name: string; role: "admin" | "owner" | "superadmin" | "user" } }>("/auth/admin/login", {
        email,
        password,
        captchaId,
        captchaAnswer,
      });

      // ✅ Save token in localStorage
      localStorage.setItem("token", res.data.token);

      // ✅ Save user in context
      login(res.data);

      // ✅ Redirect to admin dashboard
      navigate(res.data.user.role === "superadmin" ? "/superadmin/access" : "/admin");

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
      setCaptchaRefreshNonce((current) => current + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">
          Cafe Owner Login
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {error}
          </p>
        )}

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

        <LoginCaptcha
          value={captchaAnswer}
          onChange={setCaptchaAnswer}
          onCaptchaIdChange={setCaptchaId}
          refreshNonce={captchaRefreshNonce}
        />

        <button
          onClick={handleLogin}
          disabled={loading || !captchaAnswer.trim()}
          className="w-full bg-primary text-white py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <button
          onClick={() => navigate("/superadmin/login")}
          className="mt-3 w-full border border-outline/20 text-secondary py-3 rounded-xl"
        >
          Superadmin Login
        </button>
      </div>
    </div>
  );
}
