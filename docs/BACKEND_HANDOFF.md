# Integrasi backend — status terkini

Backend NestJS/PostgreSQL sudah diimplementasikan di repository terpisah `sukamaju-peduli-backend`. Kontrak endpoint ada pada `docs/API.md` repository backend; skema pada `sql/001_initial.sql` dan migrasi berikutnya.

Frontend memakai `NEXT_PUBLIC_DATA_MODE=api` secara default dan proxy `/api/*` melalui `BACKEND_URL`. `data-provider.tsx` mengambil proyeksi workspace yang telah disaring server dan mengirim mutasi ke endpoint khusus. actorId model UI tidak diteruskan ke server. Session memakai cookie HttpOnly. Foto diunggah multipart kemudian photoId diklaim dalam transaksi laporan. Token aktivasi/reset dibaca dari fragmen URL.

Mode `demo` hanya untuk UI browser. Backend diuji terpisah dengan PostgreSQL asli. Daftar sekarang memfilter/paginasi snapshot workspace; pemindahan tiap layar ke endpoint paginated merupakan tahap optimasi data besar.
