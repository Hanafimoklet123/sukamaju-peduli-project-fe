"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole, Plus, Trash2 } from "lucide-react";
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
  Modal,
} from "./ui";
function DeleteRecord({
  id,
  name,
  entity,
}: {
  id: string;
  name: string;
  entity: "categories" | "citizens" | "employees";
}) {
  const { user, command, notify } = useDemo();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label =
    entity === "categories"
      ? "kategori"
      : entity === "employees"
        ? "akun pegawai"
        : "akun warga";
  async function remove() {
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await command({
        type: "delete",
        actorId: user.id,
        entity,
        id,
      });
      if (!result.ok) {
        setError(result.error || "Data belum dapat dihapus.");
        return;
      }
      setOpen(false);
      notify("Data berhasil dihapus dari daftar pengelolaan.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Data belum dapat dihapus. Silakan coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        aria-label={"Hapus " + label + " " + name}
      >
        <Trash2 size={16} aria-hidden="true" /> Hapus
      </Button>
      {open && (
        <Modal
          title={"Hapus " + label + "?"}
          onClose={() => {
            if (!busy) setOpen(false);
          }}
        >
          <div className="delete-record-content stack">
            <p className="muted">
              Periksa kembali {label} yang akan dihapus dari daftar pengelolaan.
            </p>
            <div className="delete-record-summary">
              <span className="delete-record-icon">
                <Trash2 size={22} aria-hidden="true" />
              </span>
              <div>
                <strong className="break-word">{name}</strong>
                <small className="muted">
                  {entity === "categories"
                    ? "Kategori pengaduan"
                    : entity === "employees"
                      ? "Akun pegawai"
                      : "Akun warga"}
                </small>
              </div>
            </div>
            <Alert tone="warning" title="Dampak penghapusan">
              {entity === "categories"
                ? "Kategori tidak dapat dipilih untuk laporan baru. Riwayat laporan tetap tersimpan."
                : "Akun tidak dapat login lagi. Riwayat laporan dan aktivitas tetap tersimpan."}
            </Alert>
            {entity === "employees" && (
              <p className="muted small">
                Alihkan seluruh tugas aktif pegawai sebelum menghapus akun.
              </p>
            )}
            {error && (
              <Alert title="Belum dapat dihapus" tone="error">
                {error}
              </Alert>
            )}
            <div className="actions delete-record-actions">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={remove}
                aria-busy={busy}
              >
                <Trash2 size={16} aria-hidden="true" />
                {busy ? "Menghapus…" : `Hapus ${label}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Employees() {
  const { state } = useDemo(),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1);
  const users = state.users.filter(
    (u) =>
      u.role === "pegawai" &&
      !u.deletedAt &&
      `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(users.length / 5)));
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
        compactMobile
        count={users.length}
        headers={["Nama", "Email", "Status", "Tugas aktif", "Aksi"]}
        rows={users.slice((currentPage - 1) * 5, currentPage * 5).map((u) => [
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
          state.reports.filter(
            (r) => r.employeeId === u.id && r.status === "Diproses",
          ).length,
          <div className="actions table-row-actions" key="b">
            <Button href={`/admin/pegawai/${u.id}`} variant="secondary">
              Lihat profil
            </Button>
            <DeleteRecord id={u.id} name={u.name} entity="employees" />
          </div>,
        ])}
      />
      <Alert title="Akun dikelola admin">
        Pegawai memilih kata sandi sendiri melalui aktivasi sekali pakai.
      </Alert>
      <Pagination page={currentPage} total={users.length} onChange={setPage} />
    </>
  );
}
export function EmployeeForm({ id }: { id?: string }) {
  const { state, user, command, notify } = useDemo(),
    router = useRouter(),
    target = state.users.find(
      (u) => u.id === id && u.role === "pegawai" && !u.deletedAt,
    );
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
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const categories = state.categories.filter(
    (c) =>
      !c.deletedAt &&
      `${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(categories.length / 5)),
  );
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
      <Card>
        <Field label="Cari kategori" htmlFor="search-category">
          <input
            id="search-category"
            value={q}
            placeholder="Cari nama atau deskripsi"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </Field>
      </Card>
      <DataTable
        title="Daftar kategori"
        count={categories.length}
        headers={["Kategori", "Deskripsi", "Status", "Aksi"]}
        rows={categories
          .slice((currentPage - 1) * 5, currentPage * 5)
          .map((c) => [
            c.name,
            c.description,
            <Badge key="s" status={c.active ? "Aktif" : "Nonaktif"} />,
            <div className="actions table-row-actions" key="e">
              <Button href={`/admin/kategori/${c.id}/ubah`} variant="secondary">
                Edit kategori
              </Button>
              <DeleteRecord id={c.id} name={c.name} entity="categories" />
            </div>,
          ])}
      />
      <Pagination
        page={currentPage}
        total={categories.length}
        onChange={setPage}
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
    target = state.categories.find((c) => c.id === id && !c.deletedAt),
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
      <Link className="category-back" href="/admin/kategori">
        <ArrowLeft size={18} aria-hidden="true" />
        Kategori
      </Link>
      <Heading
        title={id ? "Ubah kategori" : "Tambah kategori"}
        description="Pastikan kategori sesuai kewenangan kelurahan."
      />
      <form className="stack category-editor" onSubmit={submit}>
        {error && (
          <Alert title="Kategori belum disimpan" tone="error">
            {error}
          </Alert>
        )}
        <div className="category-editor-grid">
          <Card>
            <h2>Informasi kategori</h2>
            <Field
              label="Nama kategori"
              htmlFor="name"
              hint={
                used
                  ? "Nama tidak dapat diubah karena sudah digunakan."
                  : undefined
              }
            >
              <div className={used ? "locked-category-input" : undefined}>
                {used && <LockKeyhole size={18} aria-hidden="true" />}
                <input
                  name="name"
                  id="name"
                  required
                  minLength={2}
                  maxLength={50}
                  defaultValue={target?.name}
                  readOnly={used}
                  aria-describedby={used ? "name-hint" : undefined}
                />
              </div>
            </Field>
            <Field label="Deskripsi" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={255}
                defaultValue={target?.description}
              />
            </Field>
          </Card>
          <Card className="category-settings">
            <h2>Ketersediaan kategori</h2>
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
              Kategori nonaktif tidak muncul pada laporan baru. Laporan lama
              tetap dapat dibaca.
            </Alert>
          </Card>
        </div>
        <div className="actions category-editor-actions">
          <Button variant="secondary" href="/admin/kategori">
            Batal
          </Button>
          <Button type="submit">
            {id ? "Simpan perubahan" : "Simpan kategori"}
          </Button>
        </div>
      </form>
    </>
  );
}
export function Citizens() {
  const { state } = useDemo(),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1);
  const users = state.users.filter(
    (u) =>
      u.role === "warga" &&
      !u.deletedAt &&
      `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(users.length / 5)));
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
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau email"
          />
        </Field>
      </Card>
      <DataTable
        title="Daftar warga"
        count={users.length}
        compactMobile
        headers={["Nama", "Email", "Status", "Laporan", "Aksi"]}
        rows={users.slice((currentPage - 1) * 5, currentPage * 5).map((u) => [
          u.name,
          <span key="e" className="break-word">
            {u.email}
          </span>,
          <Badge
            key="s"
            status={u.state === "active" ? "Aktif" : "Nonaktif"}
          />,
          state.reports.filter((r) => r.userId === u.id).length,
          <div className="actions table-row-actions" key="a">
            <Button href={`/admin/warga/${u.id}/pulihkan`} variant="secondary">
              Bantuan akun
            </Button>
            <DeleteRecord id={u.id} name={u.name} entity="citizens" />
          </div>,
        ])}
      />
      <Pagination page={currentPage} total={users.length} onChange={setPage} />
      <Alert title="Kontak hanya untuk bantuan resmi">
        Jangan meminta atau mencatat kata sandi pengguna. Verifikasi identitas
        sesuai prosedur layanan.
      </Alert>
    </>
  );
}
export function AccountRecovery({ id }: { id: string }) {
  const { state, user, command } = useDemo(),
    target = state.users.find((u) => u.id === id && !u.deletedAt),
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
      <Back href="/admin/warga">Akun warga</Back>
      <Heading
        title="Bantuan pemulihan akun"
        description="Terbitkan tautan sekali pakai setelah pemeriksaan identitas."
      />
      <div className="account-recovery-layout">
        <aside className="stack">
          <Card>
            <p className="eyebrow">AKUN YANG DIPULIHKAN</p>
            <h2>{target.name}</h2>
            <p className="muted break-word">{target.email}</p>
            <hr />
            <small className="muted">Status akun</small>
            <Badge
              status={
                target.state === "active"
                  ? "Aktif"
                  : target.state === "pending"
                    ? "Menunggu aktivasi"
                    : "Nonaktif"
              }
            />
          </Card>
          <Alert tone="warning" title="Periksa identitas pemohon">
            Gunakan prosedur verifikasi yang disepakati pengelola layanan.
            Jangan hanya mengandalkan email yang disebut pemohon.
          </Alert>
        </aside>
        <Card className="recovery-form-card">
          <div className="stack compact">
            <h2>{done ? "Tautan pemulihan siap" : "Verifikasi identitas"}</h2>
            <p className="muted small">
              {done
                ? "Berikan tautan melalui kanal resmi kepada pemilik akun."
                : "Catat hasil pemeriksaan sebelum menerbitkan tautan pemulihan."}
            </p>
          </div>
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
              <Button href={issuedUrl}>
                Buka halaman aktivasi / pemulihan
              </Button>
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
                setIssuedUrl(
                  result.url || "/pulihkan-akun?token=demo-recovery",
                );
                setDone(true);
              }}
            >
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
                  rows={3}
                  placeholder="Catat dasar pemeriksaan tanpa data sensitif yang tidak diperlukan."
                />
              </Field>
              <label className="checkbox">
                <input required type="checkbox" />
                Identitas pemohon telah diverifikasi.
              </label>
              <div className="actions recovery-form-actions">
                <Button variant="secondary" href="/admin/warga">
                  Batal
                </Button>
                <Button type="submit">Terbitkan tautan pemulihan</Button>
              </div>
              <small className="muted">
                Rancangan token berlaku 30 menit. Penerbitan ulang membatalkan
                token lama.
              </small>
            </form>
          )}
        </Card>
      </div>
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
