import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import API from "../lib/api";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Google login failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google login failed to load"));
    document.head.appendChild(script);
  });
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginCustomer } = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const returnTo = searchParams.get("returnTo") || "/";

  useEffect(() => {
    let cancelled = false;

    const setupGoogleLogin = async () => {
      if (!clientId) {
        setError("Google login is not configured yet.");
        return;
      }

      try {
        await loadGoogleScript();
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response.credential) {
              setError("Google did not return a login credential.");
              return;
            }

            try {
              setLoading(true);
              setError("");

              const res = await API.post("/auth/google", {
                credential: response.credential,
              });

              loginCustomer(res.data);
              navigate(returnTo, { replace: true });
            } catch (err: any) {
              setError(err.response?.data?.message || "Google login failed.");
            } finally {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
          shape: "rectangular",
        });
      } catch (err: any) {
        setError(err.message || "Google login failed to load.");
      }
    };

    setupGoogleLogin();

    return () => {
      cancelled = true;
    };
  }, [clientId, loginCustomer, navigate, returnTo]);

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high active:scale-95"
      >
        <ArrowLeft size={20} className="text-primary" />
      </button>

      <main className="max-w-md mx-auto pt-20 text-center">
        <p className="text-xs uppercase tracking-widest text-secondary font-bold">
          Artisan Café
        </p>
        <h1 className="mt-3 text-3xl font-headline font-extrabold text-primary">
          Sign in to order
        </h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Continue with Google to save favorites, place orders and track your café visits.
        </p>

        <div className="mt-10 flex justify-center">
          <div ref={buttonRef} />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-secondary">Signing you in...</p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
