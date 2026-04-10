import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiLogin, apiLogout, apiMe, setUnauthorizedHandler } from "../lib/api";
import type { LoginRequest, MeResponse } from "@rema/contracts";

const TOKEN_KEY = "rema_token";

type AuthState = {
  token: string | null;
  user: MeResponse | null;
  booting: boolean;
  signIn: (body: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!stored || cancelled) {
          setBooting(false);
          return;
        }
        const me = await apiMe(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(me);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (body: LoginRequest) => {
    const session = await apiLogin(body);
    await AsyncStorage.setItem(TOKEN_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const signOut = useCallback(async () => {
    const t = token;
    if (t) {
      try {
        await apiLogout(t);
      } catch {
        /* rede */
      }
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(undefined);
  }, [signOut]);

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      signIn,
      signOut,
    }),
    [token, user, booting, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
