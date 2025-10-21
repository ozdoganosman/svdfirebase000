'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, registerUnauthorizedHandler, setAdminAuthToken } from "@/lib/admin-api";

const TOKEN_STORAGE_KEY = "svd_admin_token";
const DISABLE_ADMIN_AUTH = process.env.NEXT_PUBLIC_DISABLE_ADMIN_AUTH === "true";

type AdminGuardProps = {
  children: React.ReactNode;
};

type AuthState = {
  loading: boolean;
  authorized: boolean;
  email: string | null;
  error: string | null;
};

type CredentialsState = {
  email: string;
  password: string;
};

const initialState: AuthState = {
  loading: true,
  authorized: false,
  email: null,
  error: null,
};

const initialCredentials: CredentialsState = {
  email: "",
  password: "",
};

function ProtectedAdminGuard({ children }: AdminGuardProps) {
  const [state, setState] = useState<AuthState>(initialState);
  const [credentials, setCredentials] = useState<CredentialsState>(initialCredentials);

  const resetAuth = useCallback(
    async (message?: string) => {
      // First try to make a proper logout request if we have a token
      const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      if (token) {
        try {
          setAdminAuthToken(token); // Ensure token is set for the request
          await apiFetch("/auth/logout", { method: "POST" });
        } catch (error) {
          console.warn("Logout request failed:", error);
        }
      }

      // Then clean up local state
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      setAdminAuthToken(null);
      setState({
        loading: false,
        authorized: false,
        email: null,
        error: message ?? "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
      });
    },
    []
  );

  useEffect(() => {
    registerUnauthorizedHandler(() => resetAuth());
    return () => registerUnauthorizedHandler(null);
  }, [resetAuth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const bootstrap = async () => {
      try {
        // Set the token before making the request
        setAdminAuthToken(storedToken);
        const me = await apiFetch<{ email: string }>("/auth/me");
        setState({
          loading: false,
          authorized: true,
          email: me.email,
          error: null,
        });
      } catch (error) {
        console.error("Admin session bootstrap failed", error);
        // Clear both local storage and memory token on error
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAdminAuthToken(null);
        setState({
          loading: false,
          authorized: false,
          email: null,
          error: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın."
        });
      }
    };

    void bootstrap();
  }, [resetAuth]);

  const handleCredentialsChange = useCallback((key: keyof CredentialsState, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const formDisabled = useMemo(() => state.loading, [state.loading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiFetch<{ token: string; expiresAt: number }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        }),
      });

      // First store in memory so subsequent requests are authenticated
      setAdminAuthToken(response.token);

      // Verify the token works by making a test request
      const me = await apiFetch<{ email: string }>("/auth/me");

      // If we get here, the token works, so store it
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      }

      setState({
        loading: false,
        authorized: true,
        email: me.email,
        error: null,
      });
      setCredentials(initialCredentials);
    } catch (error) {
      console.error("Admin login failed", error);
      // Clear both memory and storage on error
      setAdminAuthToken(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      setState({
        loading: false,
        authorized: false,
        email: null,
        error: (error as Error).message || "Giriş başarısız."
      });
    }
  };

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-xl bg-white px-6 py-4 text-sm text-slate-600 shadow">Yükleniyor...</div>
      </div>
    );
  }

  if (!state.authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900">Yönetici Girişi</h1>
            <p className="text-sm text-slate-600">Lütfen yönetici hesabınızın e-postası ve şifresi ile giriş yapın.</p>
          </div>
          {state.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{state.error}</div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-email">
              E-posta
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              value={credentials.email}
              onChange={(event) => handleCredentialsChange("email", event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              disabled={formDisabled}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-password">
              Şifre
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(event) => handleCredentialsChange("password", event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              disabled={formDisabled}
              required
            />
          </div>
          <button
            type="submit"
            disabled={formDisabled}
            className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {state.loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: AdminGuardProps) {
  if (DISABLE_ADMIN_AUTH) {
    return <>{children}</>;
  }
  return <ProtectedAdminGuard>{children}</ProtectedAdminGuard>;
}

