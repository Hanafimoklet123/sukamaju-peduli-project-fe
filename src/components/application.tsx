"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDemo } from "@/lib/demo-provider";
import { API_MODE, DEMO_SHORTCUTS } from "@/lib/api";
import { home } from "@/lib/domain";
import type { Role } from "@/lib/types";
import { Shell } from "./shell";
import { Alert, Back, Button, Card, Empty, Heading } from "./ui";
import {
  Authentication,
  Guide,
  Help,
  Landing,
  Privacy,
  Recovery,
} from "./public-pages";
import {
  ReportDetail,
  ReportForm,
  ReportList,
  ReportReview,
  ReportSuccess,
} from "./reports";
import { Dashboard, Recap } from "./dashboards";
import {
  AccountRecovery,
  AuditPage,
  Categories,
  CategoryForm,
  Citizens,
  EmployeeForm,
  Employees,
  Profile,
} from "./management";
export function Application() {
  const path = usePathname(),
    router = useRouter(),
    store = useDemo(),
    [retry, setRetry] = useState(0);
  const required: Role | undefined = path.startsWith("/admin")
    ? "admin"
    : path.startsWith("/pegawai")
      ? "pegawai"
      : path.startsWith("/warga")
        ? "warga"
        : undefined;
  const protectedPage = !!required || path === "/akun";
  useEffect(() => {
    if (store.ready && protectedPage && !store.user)
      router.replace(`/masuk?lanjut=${encodeURIComponent(path)}`);
  }, [store.ready, store.user, protectedPage, path, router]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [path]);
  if (!store.ready || (protectedPage && !store.user))
    return (
      <main className="standalone" aria-busy="true">
        <div className="skeleton" />
        <p className="muted">Memuat layanan…</p>
      </main>
    );
  const role = protectedPage
    ? store.user?.role
    : path === "/panduan" && store.user?.role === "warga"
      ? "warga"
      : undefined;
  let content: React.ReactNode;
  if (required && store.user!.role !== required)
    content = (
      <Card>
        <Empty
          title="Akses halaman tidak tersedia"
          action={
            <Button href={home(store.user!.role)}>
              Kembali ke beranda saya
            </Button>
          }
        >
          Halaman ini hanya tersedia untuk {required}. Pilih akun demo melalui
          Panduan review jika ingin mencoba role lain.
        </Empty>
      </Card>
    );
  else if (path === "/") content = <Landing />;
  else if (path === "/panduan") content = <Guide />;
  else if (path === "/bantuan") content = <Help />;
  else if (path === "/privasi") content = <Privacy />;
  else if (path === "/masuk") content = <Authentication key="login" />;
  else if (path === "/daftar")
    content = <Authentication key="register" register />;
  else if (path === "/pulihkan-akun") content = <Recovery />;
  else if (path === "/review") content = <ReviewGuide />;
  else if (path === "/akun") content = <Profile key={store.user!.id} />;
  else if (
    ["/warga/beranda", "/admin/beranda", "/pegawai/beranda"].includes(path)
  )
    content = <Dashboard role={required!} />;
  else if (
    ["/warga/pengaduan", "/admin/pengaduan", "/pegawai/tugas"].includes(path)
  )
    content = <ReportList key={`${path}-${retry}`} role={required!} />;
  else if (path === "/warga/pengaduan/buat") content = <ReportForm />;
  else if (path === "/warga/pengaduan/tinjau") content = <ReportReview />;
  else if (path === "/warga/pengaduan/berhasil") content = <ReportSuccess />;
  else if (
    /^\/(warga|admin)\/pengaduan\/[^/]+$/.test(path) ||
    /^\/pegawai\/tugas\/[^/]+$/.test(path)
  )
    content = (
      <ReportDetail
        key={path}
        id={decodeURIComponent(path.split("/").at(-1)!)}
        role={required!}
      />
    );
  else if (path === "/admin/pegawai") content = <Employees />;
  else if (path === "/admin/pegawai/baru") content = <EmployeeForm />;
  else if (/^\/admin\/pegawai\/[^/]+$/.test(path))
    content = (
      <EmployeeForm
        key={path}
        id={decodeURIComponent(path.split("/").at(-1)!)}
      />
    );
  else if (path === "/admin/warga") content = <Citizens />;
  else if (/^\/admin\/warga\/[^/]+\/pulihkan$/.test(path))
    content = (
      <AccountRecovery key={path} id={decodeURIComponent(path.split("/")[3])} />
    );
  else if (path === "/admin/kategori") content = <Categories />;
  else if (path === "/admin/kategori/baru") content = <CategoryForm />;
  else if (/^\/admin\/kategori\/[^/]+\/ubah$/.test(path))
    content = (
      <CategoryForm key={path} id={decodeURIComponent(path.split("/")[3])} />
    );
  else if (path === "/admin/rekap") content = <Recap />;
  else if (path === "/admin/audit") content = <AuditPage />;
  else if (path.startsWith("/status/"))
    content = (
      <StatePage
        type={path.split("/").at(-1)!}
        onRetry={() => setRetry(retry + 1)}
      />
    );
  else
    content = (
      <Card>
        <Empty
          title="Halaman tidak ditemukan"
          action={<Button href="/">Kembali ke beranda</Button>}
        >
          Tautan tidak tersedia. Periksa alamat halaman.
        </Empty>
      </Card>
    );
  return (
    <Shell role={role}>
      {content}
      {store.notice && (
        <div className="toast" role="status">
          <span>{store.notice}</span>
          <button
            className="icon-button"
            aria-label="Tutup notifikasi"
            onClick={store.clearNotice}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </Shell>
  );
}
function StatePage({ type, onRetry }: { type: string; onRetry: () => void }) {
  const { user } = useDemo();
  const data: Record<string, [string, string]> = {
    konflik: [
      "Data telah diperbarui",
      "Laporan diubah oleh pengguna lain. Muat data terbaru sebelum melanjutkan agar perubahan tidak saling menimpa.",
    ],
    "akses-ditolak": [
      "Akses tidak tersedia",
      "Anda tidak memiliki akses ke laporan ini atau penugasan telah dialihkan.",
    ],
    sesi: [
      "Sesi telah berakhir",
      "Masuk kembali untuk melanjutkan. Formulir yang belum dikirim tidak tersimpan otomatis.",
    ],
    "tidak-ditemukan": [
      "Halaman tidak ditemukan",
      "Periksa alamat atau kembali ke layanan.",
    ],
    gagal: [
      "Data belum dapat dimuat",
      "Terjadi kendala saat mengambil data. Coba muat kembali halaman.",
    ],
  };
  const [title, text] = data[type] || data["tidak-ditemukan"];
  return (
    <Card className="state-page">
      <Heading title={title} description={text} />
      <div className="actions">
        <Button
          href={type === "sesi" ? "/masuk" : user ? home(user.role) : "/"}
          onClick={onRetry}
        >
          {type === "sesi"
            ? "Masuk kembali"
            : type === "konflik"
              ? "Muat data terbaru"
              : "Kembali ke beranda"}
        </Button>
        <Button variant="secondary" href="/review">
          Panduan review
        </Button>
      </div>
    </Card>
  );
}
function ReviewGuide() {
  const { demoLogin, reset, notify } = useDemo(),
    router = useRouter(),
    [confirm, setConfirm] = useState(false);
  const tryRole = async (role: Role, route = home(role)) => {
    const result = await demoLogin(role);
    if (!result.ok) return notify(result.error!);
    router.push(route);
  };
  return (
    <>
      <Back href="/">Kembali ke beranda</Back>
      <Heading
        title="Panduan review aplikasi"
        description="Tinjau seluruh halaman Sukamaju Peduli dan coba alur dengan akun contoh."
      />
      <Alert
        title={
          API_MODE ? "Terhubung ke backend dan PostgreSQL" : "Demo browser"
        }
        tone="info"
      >
        {API_MODE
          ? "Data disimpan oleh backend. Hak akses, kata sandi dan token diperiksa server. Gunakan akun contoh untuk review lokal."
          : "Mode demo hanya menyimpan data di browser. Jangan gunakan data pribadi."}
      </Alert>
      {DEMO_SHORTCUTS && (
        <div className="three-grid">
          {(["warga", "pegawai", "admin"] as const).map((role) => (
            <Card key={role}>
              <h2>
                {role === "warga"
                  ? "Masyarakat"
                  : role === "pegawai"
                    ? "Pegawai"
                    : "Admin kelurahan"}
              </h2>
              <p className="muted">
                {role === "warga"
                  ? "Buat laporan, tinjau, kirim dan pantau hasilnya."
                  : role === "pegawai"
                    ? "Baca tugas, tambah perkembangan, catatan internal dan hasil."
                    : "Verifikasi, penugasan, akun, kategori, rekap dan audit."}
              </p>
              <Button onClick={() => tryRole(role)}>Coba sebagai {role}</Button>
            </Card>
          ))}
        </div>
      )}
      {!DEMO_SHORTCUTS && <Button href="/masuk">Masuk dengan akun Anda</Button>}
      <Card className="prose">
        <h2>Coba satu alur lengkap</h2>
        <ol className="numbered-list">
          <li>
            Masuk sebagai warga, buat laporan tanpa foto atau unggah JPG/PNG,
            tinjau lalu kirim.
          </li>
          <li>
            Buka Panduan review dan ganti menjadi admin. Temukan laporan baru,
            setujui dan tugaskan kepada Rina.
          </li>
          <li>
            Ganti menjadi pegawai. Tambahkan tanggapan, catatan internal dan
            selesaikan dengan hasil yang konkret.
          </li>
          <li>
            Kembali menjadi warga. Detail laporan memperlihatkan hasil dan
            timeline, tanpa catatan internal.
          </li>
          <li>
            Coba penolakan admin, pengalihan ke Budi, kategori nonaktif, dan
            nonaktif pegawai dengan tugas aktif.
          </li>
        </ol>
        <p className="muted">
          Data pada mode API tersimpan di PostgreSQL. Pada mode demo tersimpan
          di browser. Akun pegawai contoh default adalah Rina. Untuk mencoba
          Budi, login dengan budi.contoh@example.com dan kata sandi
          DemoSukamaju2026!.
        </p>
      </Card>
      <Card>
        <h2>Keadaan antarmuka</h2>
        <div className="review-links">
          <Button
            variant="secondary"
            onClick={() => tryRole("warga", "/warga/pengaduan?state=empty")}
          >
            Daftar kosong
          </Button>
          <Button
            variant="secondary"
            onClick={() => tryRole("warga", "/warga/pengaduan?state=loading")}
          >
            Loading
          </Button>
          {[
            ["konflik", "Konflik pembaruan"],
            ["akses-ditolak", "Akses ditolak"],
            ["sesi", "Sesi berakhir"],
            ["tidak-ditemukan", "Tidak ditemukan"],
            ["gagal", "Gagal memuat"],
          ].map(([key, text]) => (
            <Button variant="secondary" key={key} href={`/status/${key}`}>
              {text}
            </Button>
          ))}
          <Button variant="secondary" href="/pulihkan-akun">
            Panduan pemulihan akun
          </Button>
        </div>
      </Card>
      {!API_MODE && (
        <Card>
          <h2>Kembalikan data contoh</h2>
          <p className="muted">
            Menghapus perubahan demo pada browser ini dan mengembalikan dataset
            awal. Tidak memengaruhi file kode atau Figma.
          </p>
          {confirm ? (
            <div className="actions">
              <Button
                variant="danger"
                onClick={() => {
                  reset();
                  setConfirm(false);
                }}
              >
                Ya, reset data demo
              </Button>
              <Button variant="secondary" onClick={() => setConfirm(false)}>
                Batal
              </Button>
            </div>
          ) : (
            <div>
              <Button variant="secondary" onClick={() => setConfirm(true)}>
                Reset data demo
              </Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
