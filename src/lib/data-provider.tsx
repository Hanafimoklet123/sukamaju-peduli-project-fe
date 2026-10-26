"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { seed } from "./seed";
import { applyCommand } from "./domain";
import { api, ApiError, API_MODE, DEMO_SHORTCUTS } from "./api";
import type {
  Command,
  DemoState,
  Draft,
  MutationResult,
  Role,
  User,
} from "./types";
const blank = (): DemoState => ({
  schema: 1,
  users: [],
  reports: [],
  categories: [],
  audits: [],
});
const STATE_KEY = "sukamaju-review-v1",
  SESSION_KEY = "sukamaju-review-session";
type Store = {
  state: DemoState;
  user?: User;
  ready: boolean;
  notice: string;
  notify: (s: string) => void;
  clearNotice: () => void;
  draft?: Draft;
  setDraft: (d?: Draft) => void;
  login: (email: string, password: string) => Promise<MutationResult>;
  demoLogin: (role: Role) => Promise<MutationResult>;
  logout: () => Promise<MutationResult>;
  reset: () => void;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<MutationResult>;
  command: (c: Command) => Promise<MutationResult>;
  refresh: () => Promise<void>;
  changePassword: (
    current: string,
    password: string,
  ) => Promise<MutationResult>;
};
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() =>
      API_MODE ? blank() : seed(),
    ),
    ref = useRef(state),
    [userId, setUserId] = useState<string>(),
    [ready, setReady] = useState(false),
    [notice, notify] = useState(""),
    [draft, setDraft] = useState<Draft>();
  const pending = useRef(false),
    uploads = useRef(new Map<string, string>());
  const commit = useCallback((s: DemoState) => {
    ref.current = s;
    setState(s);
    if (!API_MODE)
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(s));
      } catch {
        notify(
          "Penyimpanan browser penuh. Perubahan demo tidak tersimpan setelah reload.",
        );
      }
  }, []);
  const refresh = useCallback(async () => {
    if (!API_MODE) return;
    try {
      const data = await api<DemoState & { currentUser: User }>("/workspace");
      commit(data);
      setUserId(data.currentUser.id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        commit(blank());
        setUserId(undefined);
      }
      throw e;
    }
  }, [commit]);
  useEffect(() => {
    let active = true;
    if (API_MODE) {
      void refresh()
        .catch((e) => {
          if (active && !(e instanceof ApiError && e.status === 401))
            notify(e.message);
        })
        .finally(() => {
          if (active) setReady(true);
        });
      const update = () => {
        void refresh().catch((e) => {
          if (!(e instanceof ApiError && e.status === 401)) notify(e.message);
        });
      };
      window.addEventListener("focus", update);
      const interval = setInterval(update, 30000);
      return () => {
        active = false;
        window.removeEventListener("focus", update);
        clearInterval(interval);
      };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (
        saved?.schema === 1 &&
        Array.isArray(saved.users) &&
        Array.isArray(saved.reports) &&
        Array.isArray(saved.categories) &&
        Array.isArray(saved.audits)
      )
        commit(saved);
      setUserId(sessionStorage.getItem(SESSION_KEY) || undefined);
    } catch {
      notify("Data demo sebelumnya tidak dapat dibaca.");
    }
    setReady(true);
  }, [commit, refresh]);
  const errorResult = (e: unknown): MutationResult => ({
    ok: false,
    error: e instanceof Error ? e.message : "Permintaan gagal.",
  });
  const login = async (
    email: string,
    password: string,
  ): Promise<MutationResult> => {
    try {
      let user: User;
      if (API_MODE) {
        const r = await api<{ user: User }>("/auth/login", "POST", {
          email,
          password,
        });
        user = r.user;
        setDraft(undefined);
        uploads.current.clear();
        commit(blank());
        setUserId(user.id);
        await refresh();
      } else {
        const u = ref.current.users.find(
          (u) => u.email === email && u.state === "active",
        );
        if (!u || password !== "DemoSukamaju2026!")
          return {
            ok: false,
            error: "Email atau kata sandi tidak sesuai, atau akun tidak aktif.",
          };
        user = u;
        setUserId(u.id);
        sessionStorage.setItem(SESSION_KEY, u.id);
      }
      return { ok: true, user };
    } catch (e) {
      return errorResult(e);
    }
  };
  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<MutationResult> => {
    try {
      if (API_MODE) {
        const r = await api<{ user: User }>("/auth/register", "POST", {
          name,
          email,
          phone,
          password,
          privacyAccepted: true,
        });
        await refresh();
        return { ok: true, user: r.user };
      }
      if (
        ref.current.users.some(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        )
      )
        return { ok: false, error: "Email sudah digunakan." };
      const u: User = {
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        role: "warga",
        state: "active",
      };
      commit({ ...ref.current, users: [...ref.current.users, u] });
      setUserId(u.id);
      sessionStorage.setItem(SESSION_KEY, u.id);
      return { ok: true, user: u };
    } catch (e) {
      return errorResult(e);
    }
  };
  const photoId = async (key: string, value?: string, name = "foto.jpg") => {
    if (!value) return undefined;
    if (uploads.current.has(key)) return uploads.current.get(key);
    if (!/^data:image\/(png|jpeg);base64,/.test(value))
      throw new Error("Pilih ulang foto JPG/PNG.");
    const response = await fetch(value),
      form = new FormData();
    form.append("file", await response.blob(), name);
    const r = await api<{ id: string }>("/files", "POST", form);
    uploads.current.set(key, r.id);
    return r.id;
  };
  const command = async (cmd: Command): Promise<MutationResult> => {
    if (pending.current)
      return { ok: false, error: "Tunggu permintaan sebelumnya selesai." };
    pending.current = true;
    try {
      if (!API_MODE) {
        const r = applyCommand(ref.current, cmd);
        if (r.result.ok) commit(r.state);
        return r.result;
      }
      let path = "",
        method = "POST",
        body: unknown;
      switch (cmd.type) {
        case "delete":
          path = `/${cmd.entity}/${cmd.id}`;
          method = "DELETE";
          break;
        case "submit": {
          const { photo, photoName, ...data } = cmd.draft;
          path = "/reports";
          body = {
            ...data,
            requestId: cmd.requestId,
            photoId: await photoId(cmd.requestId, photo, photoName),
          };
          break;
        }
        case "verify":
        case "reassign":
          path = `/reports/${cmd.id}/${cmd.type}`;
          body = {
            version: cmd.version,
            text: cmd.text,
            employeeId: cmd.employeeId,
          };
          break;
        case "reject":
          path = `/reports/${cmd.id}/reject`;
          body = { version: cmd.version, text: cmd.text, code: cmd.code };
          break;
        case "respond":
          path = `/reports/${cmd.id}/responses`;
          body = {
            version: cmd.version,
            text: cmd.text,
            internal: cmd.internal,
          };
          break;
        case "complete":
          path = `/reports/${cmd.id}/complete`;
          body = {
            version: cmd.version,
            text: cmd.text,
            photoId: await photoId(`${cmd.id}-${cmd.version}`, cmd.photo),
          };
          break;
        case "employee":
          path = `/employees${cmd.id ? "/" + cmd.id : ""}`;
          method = cmd.id ? "PATCH" : "POST";
          body = {
            name: cmd.name,
            email: cmd.email,
            ...(cmd.id
              ? { state: cmd.state || (cmd.active ? "active" : "inactive") }
              : {}),
          };
          break;
        case "category":
          path = `/categories${cmd.id ? "/" + cmd.id : ""}`;
          method = cmd.id ? "PATCH" : "POST";
          body = {
            name: cmd.name,
            description: cmd.description,
            active: cmd.active,
          };
          break;
        case "profile":
          path = "/me";
          method = "PATCH";
          body = { name: cmd.name, phone: cmd.phone };
          break;
        case "recover":
          path = `/users/${cmd.userId}/recovery`;
          body = { reason: cmd.reason, identityVerified: true };
          break;
      }
      const r = await api<MutationResult>(path, method, body);
      try {
        await refresh();
      } catch {
        notify(
          "Perubahan tersimpan, tetapi data terbaru belum dapat dimuat. Muat ulang halaman.",
        );
      }
      return r;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 401))
        await refresh().catch(() => {});
      return errorResult(e);
    } finally {
      pending.current = false;
    }
  };
  const logout = async (): Promise<MutationResult> => {
    try {
      if (API_MODE) await api("/auth/logout", "POST", {});
      else sessionStorage.removeItem(SESSION_KEY);
      setUserId(undefined);
      setDraft(undefined);
      uploads.current.clear();
      if (API_MODE) commit(blank());
      return { ok: true };
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUserId(undefined);
        commit(blank());
        return { ok: true };
      }
      const r = errorResult(e);
      notify(r.error!);
      return r;
    }
  };
  const changePassword = async (
    current: string,
    password: string,
  ): Promise<MutationResult> => {
    if (!API_MODE)
      return { ok: false, error: "Perubahan kata sandi memerlukan mode API." };
    try {
      await api("/auth/password/change", "POST", { current, password });
      return { ok: true };
    } catch (e) {
      return errorResult(e);
    }
  };
  return (
    <Context.Provider
      value={{
        state,
        user: state.users.find((u) => u.id === userId && u.state === "active"),
        ready,
        notice,
        notify,
        clearNotice: () => notify(""),
        draft,
        setDraft,
        login,
        register,
        command,
        refresh,
        logout,
        changePassword,
        demoLogin: async (role) =>
          !DEMO_SHORTCUTS
            ? {
                ok: false,
                error: "Masuk menggunakan akun Anda melalui halaman masuk.",
              }
            : login(
                `${role === "warga" ? "ahmad" : role === "pegawai" ? "rina" : "admin"}.contoh@example.com`,
                "DemoSukamaju2026!",
              ),
        reset: () => {
          if (API_MODE) {
            notify(
              "Reset database tidak tersedia dari aplikasi. Data PostgreSQL tetap tersimpan.",
            );
            return;
          }
          commit(seed());
          setDraft(undefined);
          notify("Data demo dikembalikan ke kondisi awal.");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const c = useContext(Context);
  if (!c) throw new Error("Data provider wajib tersedia.");
  return c;
}
