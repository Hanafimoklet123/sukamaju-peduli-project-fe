"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useDemo } from "@/lib/demo-provider";
import { localDate } from "@/lib/domain";
import { API_MODE } from "@/lib/api";
import { formatDate } from "@/lib/domain";
import {
  Alert,
  Back,
  Badge,
  Button,
  Card,
  DataTable,
  Empty,
  Field,
  Heading,
  Pagination,
} from "./ui";
export function Employees() {
  const { state } = useDemo(),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1);
  const users = state.users.filter(
    (u) =>
      u.role === "pegawai" &&
      `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Kelola pegawai"
        description="Akun operasional untuk penanganan pengaduan."
        action={
          <Button href="/admin/pegawai/baru">
            <Plus size={17} />
            Tambah pegawai
          </Button>
        }
      />
      <Card>
        <Field
          label="Cari pegawai"
          htmlFor="search-employee"
          className="search-field"
        >
          <input
            id="search-employee"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau email"
          />
        </Field>
      </Card>
      <DataTable
        title="Daftar pegawai"
        count={users.length}
        headers={["Nama", "Email", "Status", "Tugas aktif", "Aksi"]}
        rows={users.slice((page - 1) * 5, page * 5).map((u) => [
          u.name,
          <span key="e" className="muted break-word">
            {u.email}
          </span>,
          <Badge
            key="s"
            status={
              u.state === "active"
                ? "Aktif"
                : u.state === "pending"
                  ? "Menunggu aktivasi"
                  : "Nonaktif"
            }
          />,
          state.reports.filter((r) => r.employeeId === u.id).length,
          <Button href={`/admin/pegawai/${u.id}`} key="b" variant="secondary">
            Lihat profil
          </Button>,
        ])}
      />
      <Alert title="Akun dikelola admin">
        Pegawai memilih kata sandi sendiri melalui aktivasi sekali pakai.
      </Alert>
      <Pagination page={page} total={users.length} onChange={setPage} />
    </>
  );
}
export function EmployeeForm({ id }: { id?: string }) {
  const { state, user, command, notify } = useDemo(),
    router = useRouter(),
    target = state.users.find((u) => u.id === id && u.role === "pegawai");
  const [error, setError] = useState("");
  if (id && !target)
    return (
      <Card>
        <Empty
          title="Pegawai tidak ditemukan"
          action={<Button href="/admin/pegawai">Ke daftar pegawai</Button>}
        />
      </Card>
    );
  const tasks = state.reports.filter(
    (r) => r.employeeId === id && r.status === "Diproses",
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      result = await command({
        type: "employee",
        actorId: user!.id,
        id,
        name: String(f.get("name")),
        email: String(f.get("email")),
        active: f.get("state") === "active",
        state: String(f.get("state") || "pending") as
          "active" | "inactive" | "pending",
      });
    if (!result.ok) return setError(result.error!);
    notify(
      id
        ? "Data pegawai berhasil disimpan."
        : "Akun pegawai dibuat. Status menunggu aktivasi.",
    );
    router.push("/admin/pegawai");
  }
  return (
    <>
      <Back href="/admin/pegawai">Kembali ke pegawai</Back>
      <Heading
        title={id ? "Detail pegawai" : "Tambah pegawai"}
        description={
          id
            ? "Kelola akun dan pantau penugasan pegawai."
            : "Siapkan akun operasional. Pegawai memilih kata sandi sendiri."
        }
      />
      <div className="two-columns">
        <Card>
          <form onSubmit={submit} className="stack">
            {error && (
              <Alert title="Perubahan belum disimpan" tone="error">
                {error}
              </Alert>
            )}
            <Field label="Nama lengkap" htmlFor="name">
              <input
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={target?.name}
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={254}
                readOnly={!!id}
                defaultValue={target?.email}
              />
            </Field>
            {target && (
              <Field label="Status akun" htmlFor="state">
                <select name="state" id="state" defaultValue={target.state}>
                  {target.state === "pending" && (
                    <option value="pending">Menunggu aktivasi</option>
                  )}
                  {!(API_MODE && target.state === "pending") && (
                    <option value="active">Aktif</option>
                  )}
                  <option value="inactive">Nonaktif</option>
                </select>
              </Field>
            )}
            <Alert title={target ? "Perhatikan tugas aktif" : "Aktivasi akun"}>
              {target
                ? "Alihkan seluruh tugas aktif sebelum menonaktifkan akun. Riwayat tidak dihapus."
                : "Terbitkan tautan aktivasi setelah akun dibuat. Pegawai menentukan kata sandinya sendiri melalui tautan sekali pakai."}
            </Alert>
            <div className="actions align-end">
              <Button href="/admin/pegawai" variant="secondary">
                Batal
              </Button>
              <Button type="submit">
                {id ? "Simpan perubahan" : "Tambah pegawai"}
              </Button>
            </div>
          </form>
        </Card>
        <aside className="stack">
          <Card>
            <h2>Tugas aktif</h2>
            <strong className="big-number">{tasks.length}</strong>
            {tasks.length ? (
              tasks.map((r) => (
                <Button
                  variant="secondary"
                  key={r.id}
                  href={`/admin/pengaduan/${r.id}`}
                >
                  {r.number} <span aria-hidden="true">→</span>
                </Button>
              ))
            ) : (
              <p className="muted">Tidak ada penugasan aktif.</p>
            )}
          </Card>
          {target && (
            <Card>
              <h2>Aktivasi dan pemulihan</h2>
              <p className="muted small">
                Tautan berlaku 30 menit dan hanya dapat digunakan sekali.
                Terbitkan melalui pemeriksaan akun.
              </p>
              <Button
                variant="secondary"
                href={`/admin/warga/${target.id}/pulihkan`}
              >
                {target.state === "pending"
                  ? "Terbitkan tautan aktivasi"
                  : "Bantuan pemulihan"}
              </Button>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
export function Categories() {
  const { state } = useDemo();
  return (
    <>
      <Heading
        title="Kategori pengaduan"
        description="Atur pilihan pada formulir pengaduan warga."
        action={
          <Button href="/admin/kategori/baru">
            <Plus size={17} />
            Tambah kategori
          </Button>
        }
      />
      <DataTable
        title="Daftar kategori"
        headers={["Kategori", "Deskripsi", "Status", "Aksi"]}
        rows={state.categories.map((c) => [
          c.name,
          c.description,
          <Badge key="s" status={c.active ? "Aktif" : "Nonaktif"} />,
          <Button
            key="e"
            href={`/admin/kategori/${c.id}/ubah`}
            variant="secondary"
          >
            Edit kategori
          </Button>,
        ])}
      />
      <Alert title="Riwayat tetap tersimpan">
        Kategori yang dipakai laporan lama dinonaktifkan tanpa menghapus
        referensinya.
      </Alert>
    </>
  );
}
export function CategoryForm({ id }: { id?: string }) {
  const { state, user, command, notify } = useDemo(),
    router = useRouter(),
    target = state.categories.find((c) => c.id === id),
    used = !!id && state.reports.some((r) => r.categoryId === id),
    [error, setError] = useState("");
  if (id && !target)
    return (
      <Card>
        <Empty
          title="Kategori tidak ditemukan"
          action={<Button href="/admin/kategori">Ke daftar kategori</Button>}
        />
      </Card>
    );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      result = await command({
        type: "category",
        actorId: user!.id,
        id,
        name: String(f.get("name")),
        description: String(f.get("description")),
        active: f.get("state") === "active",
      });
    if (!result.ok) return setError(result.error!);
    notify("Kategori berhasil disimpan.");
    router.push("/admin/kategori");
  }
  return (
    <>
      <Back href="/admin/kategori">Kembali ke kategori</Back>
      <Heading
        title={id ? "Ubah kategori" : "Tambah kategori"}
        description="Pastikan kategori sesuai kewenangan kelurahan."
      />
      <Card className="form-limit">
        <form className="stack" onSubmit={submit}>
          {error && (
            <Alert title="Kategori belum disimpan" tone="error">
              {error}
            </Alert>
          )}
          <Field
            label="Nama kategori"
            htmlFor="name"
            hint={
              used
                ? "Nama dikunci karena sudah dipakai laporan. Buat kategori pengganti jika diperlukan."
                : undefined
            }
          >
            <input
              name="name"
              id="name"
              required
              minLength={2}
              maxLength={50}
              defaultValue={target?.name}
              readOnly={used}
            />
          </Field>
          <Field label="Deskripsi" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={255}
              defaultValue={target?.description}
            />
          </Field>
          <Field label="Status" htmlFor="state">
            <select
              id="state"
              name="state"
              defaultValue={target?.active === false ? "inactive" : "active"}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </Field>
          <Alert title="Nonaktif tidak menghapus riwayat">
            Kategori nonaktif tidak muncul pada laporan baru. Laporan lama tetap
            dapat dibaca.
          </Alert>
          <div className="actions align-end">
            <Button type="submit">Simpan kategori</Button>
            <Button variant="secondary" href="/admin/kategori">
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
export function Citizens() {
  const { state } = useDemo(),
    [q, setQ] = useState("");
  const users = state.users.filter(
    (u) =>
      u.role === "warga" &&
      `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Akun warga"
        description="Temukan akun untuk bantuan akses yang terkontrol."
      />
      <Card>
        <Field
          htmlFor="find-citizen"
          label="Cari warga"
          className="search-field"
        >
          <input
            id="find-citizen"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau email"
          />
        </Field>
      </Card>
      <DataTable
        title="Daftar warga"
        headers={["Nama", "Email", "Status", "Laporan", "Aksi"]}
        rows={users.map((u) => [
          u.name,
          <span key="e" className="break-word">
            {u.email}
          </span>,
          <Badge
            key="s"
            status={u.state === "active" ? "Aktif" : "Nonaktif"}
          />,
          state.reports.filter((r) => r.userId === u.id).length,
          <Button
            key="a"
            href={`/admin/warga/${u.id}/pulihkan`}
            variant="secondary"
          >
            Bantuan akun
          </Button>,
        ])}
      />
      <Alert title="Kontak hanya untuk bantuan resmi">
        Jangan meminta atau mencatat kata sandi pengguna. Verifikasi identitas
        sesuai prosedur layanan.
      </Alert>
    </>
  );
}
export function AccountRecovery({ id }: { id: string }) {
  const { state, user, command } = useDemo(),
    target = state.users.find((u) => u.id === id),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [issuedUrl, setIssuedUrl] = useState("");
  if (!target)
    return (
      <Card>
        <Empty
          title="Akun tidak ditemukan"
          action={<Button href="/admin/warga">Ke akun warga</Button>}
        />
      </Card>
    );
  return (
    <>
      <Back href="/admin/warga">Kembali ke akun warga</Back>
      <Heading
        title="Bantuan pemulihan akun"
        description="Terbitkan tautan sekali pakai setelah pemeriksaan identitas."
      />
      <Card className="form-limit">
        <h2>{target.name}</h2>
        <p className="muted">{target.email}</p>
        {done ? (
          <>
            <Alert title="Tautan sekali pakai diterbitkan" tone="success">
              Tindakan tercatat dalam audit. Tautan hanya ditampilkan pada
              penerbitan ini. Berikan melalui kanal resmi kepada pemilik akun;
              tidak ada email otomatis.
            </Alert>
            <Field label="Tautan untuk pemilik akun" htmlFor="issued-link">
              <input
                id="issued-link"
                readOnly
                value={issuedUrl}
                onFocus={(e) => e.currentTarget.select()}
              />
            </Field>
            <Button href={issuedUrl}>Buka halaman aktivasi / pemulihan</Button>
          </>
        ) : (
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await command({
                type: "recover",
                actorId: user!.id,
                userId: id,
                reason: String(new FormData(e.currentTarget).get("reason")),
              });
              if (!result.ok) return setError(result.error!);
              setIssuedUrl(result.url || "/pulihkan-akun?token=demo-recovery");
              setDone(true);
            }}
          >
            <Alert tone="warning" title="Periksa identitas pemohon">
              Gunakan prosedur verifikasi yang disepakati pengelola layanan.
              Jangan hanya mengandalkan email yang disebut pemohon.
            </Alert>
            {error && (
              <Alert title="Belum dapat diterbitkan" tone="error">
                {error}
              </Alert>
            )}
            <Field label="Dasar pemeriksaan identitas" htmlFor="reason">
              <textarea
                name="reason"
                id="reason"
                required
                minLength={20}
                maxLength={1000}
                rows={4}
                placeholder="Catat dasar pemeriksaan tanpa data sensitif yang tidak diperlukan."
              />
            </Field>
            <label className="checkbox">
              <input required type="checkbox" />
              Identitas pemohon telah diverifikasi.
            </label>
            <Button type="submit">Terbitkan token sekali pakai</Button>
            <small className="muted">
              Rancangan token berlaku 30 menit. Penerbitan ulang membatalkan
              token lama.
            </small>
          </form>
        )}
      </Card>
    </>
  );
}
export function AuditPage() {
  const { state } = useDemo(),
    [value, setValue] = useState({ from: "", to: "", action: "", actor: "" }),
    [filters, setFilters] = useState(value),
    [page, setPage] = useState(1),
    [error, setError] = useState("");
  const rows = state.audits.filter(
    (a) =>
      (!filters.from || localDate(a.at) >= filters.from) &&
      (!filters.to || localDate(a.at) <= filters.to) &&
      (!filters.action || a.action === filters.action) &&
      (!filters.actor || a.actor === filters.actor),
  );
  return (
    <>
      <Heading
        title="Audit aktivitas"
        description="Telusuri tindakan administratif dan alasan perubahan."
      />
      <Card>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (value.from && value.to && value.from > value.to)
              return setError("Rentang tanggal tidak valid.");
            setError("");
            setFilters(value);
            setPage(1);
          }}
        >
          <div className="four-grid">
            <Field label="Dari tanggal" htmlFor="from">
              <input
                type="date"
                id="from"
                value={value.from}
                onChange={(e) => setValue({ ...value, from: e.target.value })}
              />
            </Field>
            <Field label="Sampai tanggal" htmlFor="to">
              <input
                type="date"
                id="to"
                value={value.to}
                onChange={(e) => setValue({ ...value, to: e.target.value })}
              />
            </Field>
            <Field label="Aksi" htmlFor="action">
              <select
                id="action"
                value={value.action}
                onChange={(e) => setValue({ ...value, action: e.target.value })}
              >
                <option value="">Semua aksi</option>
                {[...new Set(state.audits.map((a) => a.action))].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Aktor" htmlFor="actor">
              <select
                id="actor"
                value={value.actor}
                onChange={(e) => setValue({ ...value, actor: e.target.value })}
              >
                <option value="">Semua aktor</option>
                {[...new Set(state.audits.map((a) => a.actor))].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
          </div>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <div className="actions align-end">
            <Button type="submit">Terapkan</Button>
            <Button
              variant="ghost"
              onClick={() => {
                const next = { from: "", to: "", action: "", actor: "" };
                setValue(next);
                setFilters(next);
                setError("");
              }}
            >
              Hapus filter
            </Button>
          </div>
        </form>
      </Card>
      <DataTable
        title="Riwayat aktivitas"
        count={rows.length}
        headers={["Waktu", "Aktor", "Aksi atau objek", "Alasan"]}
        note="Urutan terbaru"
        rows={rows.slice((page - 1) * 5, page * 5).map((a) => [
          formatDate(a.at, true),
          a.actor,
          <span key="o">
            {a.action}
            <br />
            <small className="muted">{a.object}</small>
          </span>,
          a.reason,
        ])}
      />
      <Pagination page={page} total={rows.length} onChange={setPage} />
      <Alert title="Audit tanpa kredensial">
        Kata sandi dan token pemulihan tidak dicatat sebagai isi audit.
      </Alert>
    </>
  );
}
export function Profile() {
  const { user, command, notify, changePassword } = useDemo(),
    [error, setError] = useState(""),
    [passwordError, setPasswordError] = useState("");
  return (
    <>
      <Heading
        title="Akun saya"
        description="Kelola profil dan kata sandi akun Anda."
      />
      <div className="two-columns">
        <Card>
          <h2>Informasi profil</h2>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                result = await command({
                  type: "profile",
                  actorId: user!.id,
                  name: String(f.get("name")),
                  phone: String(f.get("phone")),
                });
              if (!result.ok) return setError(result.error!);
              setError("");
              notify("Profil berhasil diperbarui.");
            }}
          >
            {error && (
              <Alert tone="error" title="Profil belum disimpan">
                {error}
              </Alert>
            )}
            <Field htmlFor="name" label="Nama lengkap">
              <input
                id="name"
                name="name"
                defaultValue={user!.name}
                required
                minLength={2}
                maxLength={100}
              />
            </Field>
            <Field
              htmlFor="email"
              label="Email"
              hint="Email login tidak dapat diubah pada MVP."
            >
              <input id="email" value={user!.email} readOnly />
            </Field>
            <Field htmlFor="phone" label="Nomor HP" hint="Opsional">
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user!.phone}
                maxLength={20}
              />
            </Field>
            <Field htmlFor="role" label="Peran">
              <input
                id="role"
                value={
                  user!.role === "warga"
                    ? "Masyarakat"
                    : user!.role === "pegawai"
                      ? "Pegawai"
                      : "Admin kelurahan"
                }
                readOnly
              />
            </Field>
            <div>
              <Button type="submit">Simpan profil</Button>
            </div>
          </form>
        </Card>
        <Card>
          <h2>Ubah kata sandi</h2>
          <Alert title={API_MODE ? "Keamanan akun" : "Mode demo"}>
            {API_MODE
              ? "Kata sandi diperiksa server. Perubahan mencabut sesi lama dan tautan pemulihan yang belum digunakan."
              : "Perubahan kata sandi memerlukan koneksi API."}
          </Alert>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const form = e.currentTarget;
              if (f.get("password") !== f.get("confirm"))
                return setPasswordError("Konfirmasi kata sandi tidak sama.");
              const result = await changePassword(
                String(f.get("current")),
                String(f.get("password")),
              );
              if (!result.ok) return setPasswordError(result.error!);
              setPasswordError("");
              notify("Kata sandi berhasil diperbarui.");
              form.reset();
            }}
          >
            {passwordError && (
              <p role="alert" className="error-text">
                {passwordError}
              </p>
            )}
            {[
              ["current", "Kata sandi lama"],
              ["password", "Kata sandi baru"],
              ["confirm", "Konfirmasi kata sandi baru"],
            ].map(([id, label]) => (
              <Field key={id} htmlFor={id} label={label}>
                <input
                  id={id}
                  name={id}
                  type="password"
                  required
                  minLength={id === "current" ? 1 : 12}
                  maxLength={128}
                  autoComplete={
                    id === "current" ? "current-password" : "new-password"
                  }
                />
              </Field>
            ))}
            <Button type="submit" variant="secondary">
              Ubah kata sandi
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
