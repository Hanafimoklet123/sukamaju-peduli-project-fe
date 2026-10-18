"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone">
      <h1>Halaman belum dapat ditampilkan</h1>
      <p>Data demo Anda tetap tersimpan. Coba muat kembali halaman.</p>
      <div className="actions">
        <button className="button primary" onClick={reset}>
          Coba lagi
        </button>
        <Link className="button" href="/">
          Ke beranda
        </Link>
      </div>
    </main>
  );
}
