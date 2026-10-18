import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone">
      <h1>Halaman tidak ditemukan</h1>
      <p>Periksa alamat atau kembali ke layanan.</p>
      <Link className="button primary" href="/">
        Kembali ke beranda
      </Link>
    </main>
  );
}
