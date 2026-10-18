"use client";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  X,
} from "lucide-react";
import { useEffect, useRef, useId, type ReactNode } from "react";
import type { Status } from "@/lib/types";
import artwork from "@/lib/artwork.json";
import { API_MODE } from "@/lib/api";
export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const cls = `button ${variant} ${className}`;
  return href ? (
    <Link className={cls} href={href}>
      {children}
    </Link>
  ) : (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}
export function Back({
  href,
  children = "Kembali ke pengaduan",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link className="back-link" href={href}>
      <ArrowLeft size={18} />
      {children}
    </Link>
  );
}
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${dark ? "brand-dark" : ""}`}
      aria-label="Sukamaju Peduli beranda"
    >
      <img src="/assets/58e97.svg" alt="" width={40} height={40} />
      <span>
        <strong>Sukamaju Peduli</strong>
        <small>Kelurahan Sukamaju</small>
      </span>
    </Link>
  );
}
export function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}
export function Heading({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Badge({
  status,
}: {
  status: Status | "Aktif" | "Nonaktif" | "Menunggu aktivasi";
}) {
  return (
    <span
      className={`badge ${["Selesai", "Aktif"].includes(status) ? "green" : ["Ditolak", "Nonaktif"].includes(status) ? "red" : ["Diterima", "Menunggu aktivasi"].includes(status) ? "amber" : "blue"}`}
    >
      {status}
    </span>
  );
}
export function Alert({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children?: ReactNode;
  tone?: "info" | "warning" | "success" | "error";
}) {
  return (
    <div
      className={`alert ${tone}`}
      role={tone === "error" ? "alert" : undefined}
    >
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  );
}
export function Field({
  label,
  hint,
  error,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor: string;
}) {
  return (
    <div className={`field ${className} ${error ? "field-error" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <small className="error-text" id={`${htmlFor}-error`} role="alert">
          {error}
        </small>
      ) : hint ? (
        <small className="muted" id={`${htmlFor}-hint`}>
          {hint}
        </small>
      ) : null}
    </div>
  );
}
export function Empty({
  title = "Tidak ada hasil pencarian",
  children,
  action,
}: {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <FileSearch size={36} strokeWidth={1.4} />
      <h2>{title}</h2>
      <p className="muted">
        {children || "Coba kata kunci lain atau hapus filter yang digunakan."}
      </p>
      {action}
    </div>
  );
}
export function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: string;
}) {
  return (
    <Card className={`metric ${tone || ""}`}>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {note && <small className="muted">{note}</small>}
    </Card>
  );
}
export function Art({
  kind,
  className = "",
}: {
  kind: keyof typeof artwork;
  className?: string;
}) {
  return (
    <div
      className={`artwork artwork-${kind} ${className}`}
      role="img"
      aria-label={
        kind === "village"
          ? "Ilustrasi lingkungan Sukamaju"
          : kind === "activity"
            ? "Ilustrasi kegiatan gotong royong"
            : kind === "tourism"
              ? "Ilustrasi ruang hijau dan wisata lokal"
              : "Ilustrasi contoh foto lampu jalan"
      }
      dangerouslySetInnerHTML={{ __html: artwork[kind] }}
    />
  );
}
export function Pagination({
  page,
  total,
  size = 5,
  onChange,
}: {
  page: number;
  total: number;
  size?: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <small className="muted">
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} dari ${total} data`
          : "0 data"}
      </small>
      <nav aria-label="Halaman data">
        <Button
          variant="secondary"
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span aria-current="page">{page}</span>
        <Button
          variant="secondary"
          disabled={page >= pages}
          aria-label="Halaman berikutnya"
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </nav>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = dialog.current;
    const focused = document.activeElement as HTMLElement;
    el?.showModal();
    return () => {
      el?.close();
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Tutup dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Checklist() {
  return (
    <ul className="checklist">
      {[
        "Judul dan uraian sesuai kejadian",
        "Lokasi lengkap dan mudah ditemukan",
        "Foto sesuai dengan laporan",
      ].map((t) => (
        <li key={t}>
          <Check size={18} />
          {t}
        </li>
      ))}
    </ul>
  );
}
export function DataTable({
  title,
  headers,
  rows,
  count,
  note,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
  count?: number;
  note?: string;
}) {
  return (
    <Card className="data-card">
      <div className="table-heading">
        <div>
          <h2>{title}</h2>
          <small className="muted">
            {count ?? rows.length} data ditampilkan
          </small>
        </div>
        <small className="muted">
          {note || "Pilih aksi pada setiap baris"}
        </small>
      </div>
      {rows.length ? (
        <>
          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-records">
            {rows.map((r, i) => (
              <article key={i} className="mobile-record">
                {r.map((cell, j) => (
                  <div key={j}>
                    <small className="muted">{headers[j]}</small>
                    <div>{cell}</div>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </>
      ) : (
        <Empty />
      )}
      <div className="table-foot">
        <small className="muted">
          {rows.length ? `Menampilkan ${rows.length} data` : "Tidak ada data"}
        </small>
        <small className="muted">
          {API_MODE ? "Data layanan" : "Data contoh untuk tinjauan"}
        </small>
      </div>
    </Card>
  );
}
