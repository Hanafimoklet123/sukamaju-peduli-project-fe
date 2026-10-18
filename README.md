# Sukamaju Peduli — Frontend Next.js

Implementasi desain Figma untuk halaman publik, warga, pegawai dan admin. Kini tersambung ke backend NestJS/PostgreSQL pada repository terpisah. Referensi: https://www.figma.com/design/L2NTgE7CV3Za4YthTGoMBq

## Menjalankan bersama backend

Gunakan Node.js 24 LTS dan npm. Siapkan backend sesuai README `sukamaju-peduli-backend`, jalankan migrasi/seed, lalu backend pada port 4000. Di frontend, salin `.env.example` menjadi `.env.local`:

```dotenv
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_ENABLE_DEMO=true
BACKEND_URL=http://127.0.0.1:4000
```

```sh
npm ci
npm run dev
```

Buka http://127.0.0.1:3000. Gunakan hostname yang sama dengan `FRONTEND_ORIGIN` backend. Next.js meneruskan `/api/*` ke NestJS; session memakai cookie HttpOnly dan data tidak disimpan di localStorage pada mode API. `.env.local` workspace sudah disiapkan untuk review lokal dan diabaikan Git.

Untuk build produksi lokal: `npm run build` kemudian `npm start`. Variabel `NEXT_PUBLIC_*` diterapkan saat build; rebuild jika mode diubah. Set `NEXT_PUBLIC_ENABLE_DEMO=false` untuk aplikasi tanpa akun contoh. Tombol demo tetap melakukan autentikasi server, tidak melewati pemeriksaan sandi.

Mode tanpa backend tersedia lewat `NEXT_PUBLIC_DATA_MODE=demo`. Mode itu menyimpan contoh di browser dan bukan bukti keamanan server. Default kode sekarang **api**; kegagalan koneksi tidak diam-diam berganti ke demo.

## Review fungsi

Buka `/review` atau `/masuk`. Seed menyediakan `ahmad.contoh@example.com`, `rina.contoh@example.com`, `budi.contoh@example.com` dan `admin.contoh@example.com` dengan kata sandi dari `SEED_PASSWORD`. Setup pengerjaan menggunakan `DemoSukamaju2026!`.

1. Masuk Warga, buat laporan, tinjau, coba Edit laporan dan kirim.
2. Masuk Admin, buka laporan baru, setujui dan tugaskan Rina.
3. Masuk Pegawai, beri tanggapan/catatan internal, lalu selesaikan.
4. Masuk Warga dan baca hasil; catatan internal tidak ditampilkan dan tidak dikirim API kepada warga.
5. Coba penolakan, pengalihan ke Budi, kategori nonaktif, nonaktif pegawai bertugas, profil, grafik dan audit.
6. Buat pegawai baru, buka bantuan aktivasi/pemulihan, isi dasar pemeriksaan, terbitkan tautan dan gunakan sekali untuk memilih sandi. Email otomatis belum aktif.

Cookie berlaku pada origin sama, sehingga tab lain mengikuti session terbaru saat data diperbarui. Data disegarkan saat fokus, setiap 30 detik dan sesudah mutasi. Reset UI hanya tersedia pada demo browser; tidak menghapus database API.

## Cakupan

- Landing Beranda/Tujuan/Panduan/Bantuan, kegiatan/wisata contoh, footer dan privasi.
- Masuk, daftar, pemulihan/aktivasi, profil, ubah sandi.
- Warga: dashboard, daftar/filter, form/validasi/foto, tinjauan, berhasil, detail/riwayat/hasil.
- Pegawai: dashboard, tugas/filter, tanggapan publik, internal, penyelesaian dan arsip.
- Admin: dashboard/grafik, verifikasi/penugasan/penolakan/pengalihan, pegawai, warga/pemulihan, kategori, rekap dan audit.
- Navigasi mobile, tabel/kartu berlabel, dialog, pagination, notifikasi, kosong/loading/error.

Pemetaan desain: [docs/SCREEN_MAP.md](docs/SCREEN_MAP.md). Pada mode API, ID rute berupa UUID database; gunakan tautan daftar, bukan ID pendek contoh browser.

## Struktur dan pemeriksaan

`src/components` berisi tampilan/komponen bersama. `src/lib/data-provider.tsx` mengatur API/demo, `api.ts` HTTP, `domain.ts` perhitungan UI dan aturan demo, `types.ts` kontrak frontend. `public/assets` menyimpan SVG lokal Figma. Route memakai optional catch-all App Router dan dispatch `application.tsx`.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Build produksi, typecheck, lint dan 9 test domain berhasil. Backend memiliki 11 test HTTP/PostgreSQL lulus. Alur lengkap juga berhasil diperiksa melalui browser. Playwright Edge otomatis belum dinyatakan lulus karena proses browser pengujian sebelumnya terhenti saat launch. Test E2E menyesuaikan UUID database; jalankan dengan backend/seed dan tombol demo aktif.

## Batas review

Daftar memfilter/paginasi proyeksi `/workspace` di browser. Endpoint pagination server tersedia untuk tahap optimasi data besar. Grafik UI memakai data API; backend menyediakan analytics dengan definisi sama. Draft belum dipersistenkan setelah reload. Foto API privat; mode demo tetap terpisah.

Kesamaan visual setiap frame belum seluruhnya diverifikasi. Belum ada deployment/pengujian beban. Kontrak API, SQL, hasil pengujian dan batas operasional tersedia di README serta docs repository backend.
