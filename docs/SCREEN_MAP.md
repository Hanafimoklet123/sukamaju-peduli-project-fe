# Pemetaan desain ke frontend

Pembaruan integrasi: mode API sudah tersambung NestJS/PostgreSQL. ID pendek seperti `124`, `p1`, dan `c1` pada tabel di bawah hanya berlaku untuk demo browser. Pada mode API, gunakan tautan dari daftar; objek memakai UUID database. Pemulihan/aktivasi API menggunakan token pada fragmen URL dan benar-benar mengubah kata sandi.

Status: kode tampilan dan interaksi demo tersedia. Kesamaan visual seluruh frame belum selesai diverifikasi. Desktop dan mobile menggunakan route yang sama dengan CSS responsif; state tambahan berupa dialog, validasi, atau data contoh, bukan halaman duplikat.

| ID Figma                                   | Tampilan                                | Route / pemicu                                                                                                       |
| ------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| PUB01                                      | Landing, Beranda/Tujuan/Panduan/Bantuan | `/` dan anchor section                                                                                               |
| PUB02                                      | Panduan                                 | `/panduan`                                                                                                           |
| PUB03                                      | Bantuan                                 | `/bantuan`                                                                                                           |
| PUB04                                      | Privasi                                 | `/privasi`                                                                                                           |
| AUTH01 / AUTH01_ERROR                      | Masuk / gagal                           | `/masuk`, kredensial salah                                                                                           |
| AUTH02                                     | Registrasi                              | `/daftar`                                                                                                            |
| ACC01                                      | Profil dan form kata sandi              | `/akun`                                                                                                              |
| ACC02 / ACC02_TOKEN                        | Pemulihan dan aktivasi/reset contoh     | `/pulihkan-akun`, `?token=contoh`                                                                                    |
| W01                                        | Beranda warga                           | `/warga/beranda`                                                                                                     |
| W02                                        | Daftar dan filter pengaduan             | `/warga/pengaduan`                                                                                                   |
| W02_EMPTY                                  | Belum ada laporan                       | `/warga/pengaduan?state=empty`                                                                                       |
| W02_FILTER                                 | Pencarian tanpa hasil                   | Kata kunci yang tidak ditemukan lalu terapkan filter                                                                 |
| W02_LOADING                                | Contoh loading                          | `/warga/pengaduan?state=loading`                                                                                     |
| W03                                        | Buat laporan                            | `/warga/pengaduan/buat`                                                                                              |
| W03_INVALID                                | Kesalahan form                          | Kirim isian belum valid                                                                                              |
| W03_UPLOAD                                 | Unggah gagal                            | Pilih selain JPG/PNG atau ukuran >2 MB                                                                               |
| W03_REVIEW                                 | Tinjau                                  | Isi form valid lalu Tinjau pengaduan                                                                                 |
| W03_SUCCESS                                | Berhasil                                | Kirim dari tinjauan; `/warga/pengaduan/berhasil?id=...`                                                              |
| W04 / W04_RECEIVED / W04_DONE / W04_REJECT | Detail dan status                       | `/warga/pengaduan/124` (proses), `/126` (diterima), `/103` (selesai), `/98` (ditolak), dengan prefix route yang sama |
| P01                                        | Dashboard pegawai                       | `/pegawai/beranda`                                                                                                   |
| P02                                        | Tugas dan filter                        | `/pegawai/tugas`                                                                                                     |
| P03                                        | Detail penanganan                       | `/pegawai/tugas/124`                                                                                                 |
| P03_RESPONSE                               | Tanggapan publik                        | Tombol Tambah tanggapan; `?aksi=tanggapan`                                                                           |
| P03_INTERNAL                               | Catatan internal                        | Tombol Catatan internal; `?aksi=internal`                                                                            |
| P03_CLOSE                                  | Selesaikan                              | Tombol Selesaikan laporan; `?aksi=selesai`                                                                           |
| P03_DONE                                   | Arsip selesai                           | `/pegawai/tugas/103` sebagai Rina                                                                                    |
| A01                                        | Dashboard, grafik bulan/kuartal         | `/admin/beranda`                                                                                                     |
| A02                                        | Semua pengaduan dan filter terpadu      | `/admin/pengaduan`                                                                                                   |
| A03                                        | Verifikasi                              | `/admin/pengaduan/126`                                                                                               |
| A03_ASSIGN                                 | Setujui dan tugaskan                    | Tombol Setujui dan tugaskan; `?aksi=setujui`                                                                         |
| A03_REJECT                                 | Penolakan beralasan                     | Tombol Tolak pengaduan; `?aksi=tolak`                                                                                |
| A03_PROCESSING                             | Sedang ditangani                        | `/admin/pengaduan/124`                                                                                               |
| A03_REASSIGN                               | Alihkan tugas                           | Tombol Alihkan penugasan; `?aksi=alihkan`                                                                            |
| A04                                        | Daftar pegawai                          | `/admin/pegawai`                                                                                                     |
| A04_NEW                                    | Tambah pegawai                          | `/admin/pegawai/baru`                                                                                                |
| A05                                        | Detail/edit akun pegawai                | `/admin/pegawai/p1`                                                                                                  |
| A05_BLOCKED                                | Penonaktifan ditolak saat tugas aktif   | Nonaktifkan Rina lalu simpan                                                                                         |
| A06                                        | Daftar warga                            | `/admin/warga`                                                                                                       |
| A06_RECOVERY                               | Bantuan pemulihan                       | `/admin/warga/w1/pulihkan`                                                                                           |
| A07                                        | Daftar kategori                         | `/admin/kategori`                                                                                                    |
| A07_EDIT                                   | Tambah / edit kategori                  | `/admin/kategori/baru`, `/admin/kategori/c1/ubah`                                                                    |
| A08                                        | Rekap pelayanan                         | `/admin/rekap`                                                                                                       |
| A09                                        | Audit aktivitas                         | `/admin/audit`                                                                                                       |
| CONFLICT                                   | Konflik perubahan                       | `/status/konflik`; domain menolak mutasi dengan versi lama                                                           |
| FORBIDDEN                                  | Akses tidak tersedia                    | `/status/akses-ditolak` atau detail milik akun lain                                                                  |
| NOTFOUND                                   | Tidak ditemukan                         | `/status/tidak-ditemukan` atau route tak dikenal                                                                     |
| SESSION                                    | Sesi berakhir                           | `/status/sesi`; route terlindungi mengarahkan akun tanpa sesi ke masuk                                               |
| MOBILE_MENU                                | Navigasi ringkas                        | Lebar mobile, tombol Buka menu                                                                                       |

ID data hanya berlaku untuk dataset awal. Setelah perubahan status melalui demo, tampilan detail menyesuaikan data. Reset melalui `/review` untuk mengulang skenario. Pengguna warga awal hanya dapat membaca laporannya sendiri. Kondisi loading/konflik/sesi merupakan simulasi frontend, belum dipicu jaringan/API sesungguhnya.

## Keputusan implementasi

- Admin menerima, memverifikasi, menugaskan dan mengalihkan. Pegawai penanggung jawab memberi tanggapan dan menyelesaikan.
- Satu penanggung jawab aktif per laporan; pengalihan menutup tugas sebelumnya.
- Laporan selesai/ditolak menjadi arsip baca. Warga tidak mengedit isi asli setelah kirim.
- Filter desktop disatukan, tabel berubah menjadi kartu berlabel pada mobile.
- Tombol kembali berupa tautan berikon panah dengan ukuran konsisten. Tombol simpan/batal bersebelahan pada form admin.
- Grafik membedakan kejadian laporan masuk pada `createdAt` dengan penyelesaian pada `resolvedAt`. Grafik tersebut berbeda dari metrik rekap yang memakai kelompok laporan berdasarkan periode pengiriman.
- Konten kegiatan/wisata dan lambang merupakan contoh sesuai desain; belum menjadi CMS.
