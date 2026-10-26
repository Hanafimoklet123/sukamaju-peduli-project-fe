"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/lib/demo-provider";
import type { Role } from "@/lib/types";
import { Brand, Button } from "./ui";
import { API_MODE } from "@/lib/api";
const menus: Record<Role, [string, string][]> = {
  admin: [
    ["Dashboard", "/admin/beranda"],
    ["Pengaduan", "/admin/pengaduan"],
    ["Pegawai", "/admin/pegawai"],
    ["Warga", "/admin/warga"],
    ["Kategori", "/admin/kategori"],
    ["Rekap", "/admin/rekap"],
    ["Audit", "/admin/audit"],
    ["Akun", "/akun"],
  ],
  pegawai: [
    ["Beranda", "/pegawai/beranda"],
    ["Tugas saya", "/pegawai/tugas"],
    ["Akun", "/akun"],
  ],
  warga: [
    ["Beranda", "/warga/beranda"],
    ["Pengaduan saya", "/warga/pengaduan"],
    ["Panduan", "/panduan"],
  ],
};
export function Shell({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const path = usePathname(),
    router = useRouter(),
    { user, logout } = useDemo();
  const [mobile, setMobile] = useState(false),
    [account, setAccount] = useState(false);
  const internal = role === "admin" || role === "pegawai";
  const active = (url: string) =>
    path === url || (url !== "/akun" && path.startsWith(url + "/"));
  const exit = async () => {
    const result = await logout();
    if (!result.ok) return;
    router.push("/masuk");
  };
  const publicLinks = [
    ["Beranda", "/#beranda"],
    ["Tujuan", "/#tujuan"],
    ["Panduan", "/#panduan"],
    ["Bantuan", "/#bantuan"],
  ];
  const nav = (mobileVersion = false) =>
    (role ? menus[role] : publicLinks).map(([name, url]) => (
      <Link
        key={url}
        href={url}
        onClick={() => mobileVersion && setMobile(false)}
        className={active(url) ? "active" : ""}
        aria-current={active(url) ? "page" : undefined}
      >
        {name}
      </Link>
    ));
  return (
    <div className={internal ? "app-frame internal" : "app-frame"}>
      <a href="#main" className="skip-link">
        Langsung ke isi halaman
      </a>
      {internal && (
        <aside className="sidebar">
          <Brand dark />
          <p className="role-label">
            {role === "admin" ? "ADMIN KELURAHAN" : "RUANG PEGAWAI"}
          </p>
          <nav aria-label="Menu utama">{nav()}</nav>
          <div className="sidebar-bottom">
            <p>
              Kelurahan Sukamaju
              <br />
              <small>Contoh lingkungan demo</small>
            </p>
            <Button variant="secondary" onClick={exit}>
              Keluar
            </Button>
          </div>
        </aside>
      )}
      <div className="app-column">
        <header className={`site-header ${internal ? "internal-header" : ""}`}>
          <div className="header-inner">
            {internal ? (
              <span className="muted space-title">
                Ruang {role === "admin" ? "Admin" : "Pegawai"}
              </span>
            ) : (
              <Brand />
            )}
            {!internal && (
              <nav className="desktop-nav" aria-label="Menu utama">
                {nav()}
              </nav>
            )}
            <div className="header-actions">
              {role && user ? (
                <>
                  {role === "warga" && (
                    <Button
                      href="/warga/pengaduan/buat"
                      className="desktop-create"
                    >
                      Buat pengaduan
                    </Button>
                  )}
                  <div className="account-menu">
                    <button
                      className="account-toggle"
                      aria-expanded={account}
                      onClick={() => setAccount(!account)}
                    >
                      {role === "admin" ? "Admin" : user.name.split(" ")[0]}
                      <ChevronDown size={14} />
                    </button>
                    {account && (
                      <div className="dropdown">
                        <Link href="/akun" onClick={() => setAccount(false)}>
                          Akun saya
                        </Link>
                        <button onClick={exit}>
                          <LogOut size={15} />
                          Keluar
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="auth-actions">
                  <Button href="/masuk" variant="secondary">
                    Masuk
                  </Button>
                  <Button href="/daftar">Daftar akun</Button>
                </div>
              )}
              <button
                className="mobile-menu-button icon-button"
                onClick={() => setMobile(!mobile)}
                aria-label={mobile ? "Tutup menu" : "Buka menu"}
                aria-expanded={mobile}
              >
                {mobile ? <X /> : <Menu />}
              </button>
            </div>
          </div>
          {mobile && (
            <nav className="mobile-nav" aria-label="Navigasi mobile">
              {nav(true)}
              {role === "warga" && (
                <Link href="/akun" onClick={() => setMobile(false)}>
                  Akun saya
                </Link>
              )}
              {!user && (
                <>
                  <Link href="/masuk" onClick={() => setMobile(false)}>
                    Masuk
                  </Link>
                  <Link href="/daftar" onClick={() => setMobile(false)}>
                    Daftar akun
                  </Link>
                </>
              )}
            </nav>
          )}
        </header>
        <main
          id="main"
          className={
            path === "/"
              ? "landing"
              : internal
                ? `page-content internal-content${role === "admin" ? " admin-content" : ""}`
                : `page-content citizen-content${["/masuk", "/daftar", "/pulihkan-akun"].includes(path) ? " auth-content" : ""}`
          }
        >
          {children}
        </main>
        {!role && path !== "/" && <Footer />}
      </div>
      {!user && (
        <Link className="demo-badge" href="/review">
          {API_MODE ? "Panduan review" : "Demo frontend"}
        </Link>
      )}
    </div>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Brand />
          <p className="muted small">
            Layanan pengaduan masyarakat
            <br />
            Kelurahan Sukamaju.
          </p>
        </div>
        <nav aria-label="Tautan footer">
          <Link href="/panduan">Panduan</Link>
          <Link href="/bantuan">Bantuan</Link>
          <Link href="/privasi">Kebijakan privasi</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <small>© 2026 Sukamaju Peduli</small>
        <small>Bersama merawat lingkungan Sukamaju.</small>
      </div>
    </footer>
  );
}
