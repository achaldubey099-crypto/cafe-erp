import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import API from "../../lib/api";

type CaptchaResponse = {
  captchaId: string;
  captchaSvg: string;
};

type LoginCaptchaProps = {
  value: string;
  onChange: (value: string) => void;
  onCaptchaIdChange?: (value: string) => void;
  refreshNonce?: number;
};

export default function LoginCaptcha({
  value,
  onChange,
  onCaptchaIdChange,
  refreshNonce = 0,
}: LoginCaptchaProps) {
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCaptcha = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get<CaptchaResponse>("/auth/captcha");
      setCaptchaSvg(res.data.captchaSvg);
      onCaptchaIdChange?.(res.data.captchaId);
      onChange("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load captcha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, [refreshNonce]);

  const svgUrl = captchaSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(captchaSvg)}` : "";

  return (
    <div className="mb-6 rounded-2xl border border-outline/20 bg-surface-container-low p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-secondary">Captcha Check</p>
          <p className="text-xs text-secondary">Solve the captcha before logging in.</p>
        </div>
        <button
          type="button"
          onClick={loadCaptcha}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-outline/20 bg-white px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline/10 bg-white">
        {svgUrl ? (
          <img src={svgUrl} alt="Login captcha challenge" className="h-20 w-full object-cover" />
        ) : (
          <div className="flex h-20 items-center justify-center text-sm text-secondary">
            {loading ? "Loading captcha..." : "Captcha unavailable"}
          </div>
        )}
      </div>

      <input
        type="text"
        inputMode="numeric"
        placeholder="Enter captcha answer"
        className="mt-3 w-full rounded-xl border border-outline/20 bg-white p-3 text-sm outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
