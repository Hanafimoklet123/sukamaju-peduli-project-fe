"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Upload, X } from "lucide-react";
import { useDemo } from "@/lib/demo-provider";
import { localDate } from "@/lib/domain";
import {
  canRead,
  categoryName,
  formatDate,
  validateDraft,
  visibleReports,
} from "@/lib/domain";
import {
  statuses,
  type Command,
  type Draft,
  type Report,
  type Role,
} from "@/lib/types";
import {
  Alert,
  Art,
  Back,
  Badge,
  Button,
  Card,
  Checklist,
  DataTable,
  Empty,
  Field,
  Heading,
  Metric,
  Modal,
  Pagination,
} from "./ui";

type Filters = {
  q: string;
  status: string;
  category: string;
  employee: string;
  from: string;
  to: string;
};
const emptyFilters: Filters = {
  q: "",
  status: "",
  category: "",
  employee: "",
  from: "",
  to: "",
};
export function FilterPanel({
  value,
  setValue,
  apply,
  reset,
  internal = false,
  dates = false,
  search = true,
  title = "Cari",
  button = "Terapkan filter",
}: {
  value: Filters;
  setValue: (v: Filters) => void;
  apply: () => void;
  reset: () => void;
  internal?: boolean;
  dates?: boolean;
  search?: boolean;
  title?: string;
  button?: string;
}) {
  const { state } = useDemo(),
    [error, setError] = useState("");
  const update = (k: keyof Filters, v: string) =>
    setValue({ ...value, [k]: v });
  return (
    <Card className="filter-panel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.from && value.to && value.from > value.to)
            return setError("Tanggal awal tidak boleh melebihi tanggal akhir.");
          setError("");
          apply();
        }}
        className="stack"
      >
        <div className="filter-grid">
          {search && (
            <Field label={title} htmlFor="search">
              <input
                id="search"
                placeholder="Cari nomor atau judul"
                value={value.q}
                onChange={(e) => update("q", e.target.value)}
              />
            </Field>
          )}
          <Field label="Status" htmlFor="status-filter">
            <select
              id="status-filter"
              value={value.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="">Semua status</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Kategori" htmlFor="category-filter">
            <select
              id="category-filter"
              value={value.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Semua kategori</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {(dates || internal) && (
          <div className="filter-grid secondary-filters">
            <Field label="Dari tanggal" htmlFor="from">
              <input
                id="from"
                type="date"
                value={value.from}
                onChange={(e) => update("from", e.target.value)}
              />
            </Field>
            <Field label="Sampai tanggal" htmlFor="to">
              <input
                id="to"
                type="date"
                value={value.to}
                onChange={(e) => update("to", e.target.value)}
              />
            </Field>
            {internal && (
              <Field label="Pegawai" htmlFor="employee-filter">
                <select
                  id="employee-filter"
                  value={value.employee}
                  onChange={(e) => update("employee", e.target.value)}
                >
                  <option value="">Semua pegawai</option>
                  <option value="unassigned">Belum ditugaskan</option>
                  {state.users
                    .filter((u) => u.role === "pegawai")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </Field>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="actions align-end">
          <Button
            type="submit"
            variant={internal || dates ? "primary" : "secondary"}
          >
            {button}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setError("");
              reset();
            }}
          >
            Hapus filter
          </Button>
        </div>
      </form>
    </Card>
  );
}
export function filterReports(reports: Report[], f: Filters) {
  return reports.filter(
    (r) =>
      (!f.q ||
        `${r.title} ${r.number}`.toLowerCase().includes(f.q.toLowerCase())) &&
      (!f.status || r.status === f.status) &&
      (!f.category || r.categoryId === f.category) &&
      (!f.employee ||
        (f.employee === "unassigned"
          ? !r.employeeId && r.status === "Diterima"
          : (r.employeeId || r.lastEmployeeId) === f.employee)) &&
      (!f.from || localDate(r.createdAt) >= f.from) &&
      (!f.to || localDate(r.createdAt) <= f.to),
  );
}
export function ReportCards({
  reports,
  base = "/warga/pengaduan",
}: {
  reports: Report[];
  base?: string;
}) {
  const { state } = useDemo();
  return (
    <div className="report-cards">
      {reports.map((r) => (
        <article className="report-card" key={r.id}>
          <div className="row-between">
            <small>{r.number}</small>
            <Badge status={r.status} />
          </div>
          <h2>
            <Link href={`${base}/${r.id}`}>{r.title}</Link>
          </h2>
          <p className="small muted">
            {categoryName(state, r.categoryId)}{" "}
            <span aria-hidden="true">•</span> {formatDate(r.createdAt)}
          </p>
          <div className="row-between">
            <p className="muted small">
              {r.status === "Diterima"
                ? "Laporan menunggu pemeriksaan admin."
                : r.status === "Diproses"
                  ? "Petugas sedang memeriksa dan menindaklanjuti laporan."
                  : r.status === "Selesai"
                    ? "Hasil penanganan tersedia untuk dibaca."
                    : "Baca alasan dan arahan pada detail laporan."}
            </p>
            <Button href={`${base}/${r.id}`} variant="secondary">
              Lihat detail <ArrowRight size={16} />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
export function ReportList({ role }: { role: Role }) {
  const { state, user } = useDemo(),
    params = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
      ...emptyFilters,
      status: params.get("status") || "",
    }),
    [applied, setApplied] = useState(filters),
    [page, setPage] = useState(1),
    [tab, setTab] = useState("active");
  const internal = role !== "warga";
  const base =
    role === "admin"
      ? "/admin/pengaduan"
      : role === "pegawai"
        ? "/pegawai/tugas"
        : "/warga/pengaduan";
  const all = visibleReports(state, user!);
  const available =
    role === "pegawai"
      ? all.filter((r) =>
          tab === "active"
            ? r.status === "Diproses"
            : ["Selesai", "Ditolak"].includes(r.status),
        )
      : all;
  const reports =
      params.get("state") === "empty"
        ? []
        : filterReports(available, applied).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          ),
    size = 5,
    current = Math.min(page, Math.max(1, Math.ceil(reports.length / size))),
    paged = reports.slice((current - 1) * size, current * size);
  return (
    <>
      <Heading
        eyebrow={role === "warga" ? "RUANG WARGA" : undefined}
        title={
          role === "admin"
            ? "Semua pengaduan"
            : role === "pegawai"
              ? "Tugas saya"
              : "Pengaduan saya"
        }
        description={
          role === "admin"
            ? "Cari, verifikasi, dan kelola penugasan laporan."
            : role === "pegawai"
              ? "Kelola tugas aktif dan baca arsip penanganan Anda."
              : "Pantau setiap laporan dan baca hasil penanganannya."
        }
      />
      {role === "warga" && (
        <div className="three-grid">
          {statuses.slice(0, 3).map((s) => (
            <Metric
              key={s}
              label={s}
              value={all.filter((r) => r.status === s).length}
              tone={
                s === "Selesai"
                  ? "metric-green"
                  : s === "Diterima"
                    ? "metric-amber"
                    : "metric-blue"
              }
            />
          ))}
        </div>
      )}
      {role === "pegawai" && (
        <div className="tabs" role="group" aria-label="Jenis tugas">
          <Button
            variant={tab === "active" ? "primary" : "secondary"}
            onClick={() => {
              setTab("active");
              setPage(1);
            }}
          >
            Tugas aktif
          </Button>
          <Button
            variant={tab === "archive" ? "primary" : "secondary"}
            onClick={() => {
              setTab("archive");
              setPage(1);
            }}
          >
            Arsip penanganan
          </Button>
        </div>
      )}
      <FilterPanel
        value={filters}
        setValue={setFilters}
        apply={() => {
          setApplied(filters);
          setPage(1);
        }}
        reset={() => {
          setFilters(emptyFilters);
          setApplied(emptyFilters);
          setPage(1);
        }}
        internal={role === "admin"}
        title={role === "warga" ? "Cari laporan" : "Cari"}
      />
      {params.get("state") === "loading" ? (
        <Card aria-busy="true" className="stack">
          <div className="skeleton" />
          <div className="skeleton" />
          <p className="muted">Memuat daftar pengaduan…</p>
          <Button variant="secondary" href={base}>
            Selesai melihat contoh loading
          </Button>
        </Card>
      ) : reports.length ? (
        <>
          {internal ? (
            <DataTable
              title={role === "admin" ? "Daftar pengaduan" : "Daftar tugas"}
              count={reports.length}
              headers={[
                "Nomor",
                "Judul",
                "Status",
                role === "admin" ? "Pegawai" : "Kategori",
                "Aksi",
              ]}
              rows={paged.map((r) => [
                <span className="muted" key="n">
                  {r.number}
                </span>,
                r.title,
                <Badge key="s" status={r.status} />,
                role === "admin"
                  ? state.users.find(
                      (u) => u.id === (r.employeeId || r.lastEmployeeId),
                    )?.name || "Belum ditugaskan"
                  : categoryName(state, r.categoryId),
                <Button key="a" href={`${base}/${r.id}`} variant="secondary">
                  {role === "admin" ? "Lihat detail" : "Buka tugas"}
                </Button>,
              ])}
            />
          ) : (
            <div
              key={`${current}-${JSON.stringify(applied)}`}
              className="report-list-scroll"
              role="region"
              aria-label="Daftar pengaduan, gulir untuk melihat laporan lainnya"
              tabIndex={0}
            >
              <ReportCards reports={paged} base={base} />
            </div>
          )}
          <Pagination
            page={current}
            total={reports.length}
            size={size}
            onChange={setPage}
          />
        </>
      ) : (
        <Card>
          <Empty
            title={
              all.length
                ? "Tidak ada hasil pencarian"
                : role === "warga"
                  ? "Belum ada pengaduan"
                  : "Belum ada tugas pada daftar ini"
            }
            action={
              role === "warga" ? (
                <Button href="/warga/pengaduan/buat">Buat pengaduan</Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilters(emptyFilters);
                    setApplied(emptyFilters);
                  }}
                >
                  Hapus filter
                </Button>
              )
            }
          />
        </Card>
      )}
    </>
  );
}
export async function readPhoto(file: File): Promise<string> {
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    !/\.(png|jpe?g)$/i.test(file.name)
  )
    throw new Error("Pilih gambar JPG atau PNG.");
  if (file.size > 2 * 1024 * 1024)
    throw new Error("Ukuran foto maksimal 2 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Berkas tidak dapat dibaca sebagai gambar.");
  }
  if (bitmap.width * bitmap.height > 12_000_000) {
    bitmap.close();
    throw new Error("Resolusi foto maksimal 12 megapiksel.");
  }
  const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height)),
    canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
export function PhotoUpload({
  photo,
  name,
  setPhoto,
  error,
  setError,
}: {
  photo?: string;
  name?: string;
  setPhoto: (photo?: string, name?: string) => void;
  error?: string;
  setError: (error: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="stack compact">
      {photo ? (
        <div className="photo-preview">
          <img src={photo} alt="Pratinjau foto pendukung" />
          <div className="row-between">
            <small>{name}</small>
            <Button variant="ghost" onClick={() => setPhoto(undefined)}>
              <X size={16} />
              Hapus foto
            </Button>
          </div>
        </div>
      ) : (
        <label className="upload-zone">
          <Upload size={20} />
          <strong>
            {loading ? "Memeriksa foto…" : "Pilih foto pendukung"}
          </strong>
          <small className="muted">
            JPG atau PNG • maksimal 2 MB • opsional
          </small>
          <input
            type="file"
            accept="image/jpeg,image/png"
            aria-label="Pilih foto pendukung"
            disabled={loading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLoading(true);
              setError("");
              try {
                const result = await readPhoto(file);
                setPhoto(result, file.name);
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setLoading(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function ReportForm() {
  const { state, draft, setDraft } = useDemo(),
    router = useRouter();
  const [value, setValue] = useState<Draft>(
      () =>
        draft || { title: "", categoryId: "", description: "", location: "" },
    ),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [photoError, setPhotoError] = useState("");
  const update = (key: keyof Draft, v: string) =>
    setValue({ ...value, [key]: v });
  async function submit(e: FormEvent) {
    e.preventDefault();
    const next = validateDraft(value);
    setErrors(next);
    if (Object.keys(next).length || photoError) {
      requestAnimationFrame(() =>
        (
          document.querySelector('[aria-invalid="true"]') as HTMLElement
        )?.focus(),
      );
      return;
    }
    setDraft(value);
    router.push("/warga/pengaduan/tinjau");
  }
  return (
    <>
      <Back href="/warga/pengaduan" />
      <Heading
        eyebrow="PENGADUAN WARGA"
        title="Buat pengaduan"
        description="Ceritakan kejadian dengan jelas agar petugas lebih mudah menindaklanjuti."
      />
      <Progress step={1} />
      <div className="two-columns form-columns">
        <Card>
          <form onSubmit={submit} className="stack">
            <h2>01 Informasi kejadian</h2>
            <small className="muted">Kolom bertanda * wajib diisi.</small>
            <Field
              label="Judul pengaduan *"
              htmlFor="title"
              hint="10–150 karakter • Ringkas dan spesifik"
              error={errors.title}
            >
              <input
                id="title"
                value={value.title}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : "title-hint"}
                maxLength={150}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Misalnya Lampu jalan tidak menyala"
              />
            </Field>
            <Field
              label="Kategori *"
              htmlFor="categoryId"
              hint="Pilih kategori yang paling sesuai."
              error={errors.categoryId}
            >
              <select
                id="categoryId"
                value={value.categoryId}
                aria-invalid={!!errors.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
              >
                <option value="">Pilih kategori</option>
                {state.categories
                  .filter((c) => c.active)
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field
              label="Uraian kejadian *"
              htmlFor="description"
              hint="30–5.000 karakter • Apa yang terjadi dan sejak kapan?"
              error={errors.description}
            >
              <textarea
                id="description"
                value={value.description}
                aria-invalid={!!errors.description}
                maxLength={5000}
                rows={5}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ceritakan kejadian, waktu, serta dampaknya bagi warga."
              />
            </Field>
            <hr />
            <h2>02 Lokasi kejadian</h2>
            <Field
              label="Alamat atau patokan lokasi *"
              htmlFor="location"
              hint="5–255 karakter • Sertakan jalan, RT/RW, dan patokan."
              error={errors.location}
            >
              <input
                id="location"
                value={value.location}
                aria-invalid={!!errors.location}
                maxLength={255}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Jalan, RT/RW, dan patokan yang mudah ditemukan"
              />
            </Field>
            <hr />
            <h2>03 Foto pendukung</h2>
            <PhotoUpload
              photo={value.photo}
              name={value.photoName}
              setPhoto={(photo, photoName) =>
                setValue({ ...value, photo, photoName })
              }
              error={photoError}
              setError={setPhotoError}
            />
            <hr />
            <div className="actions">
              <Button type="submit">
                Tinjau pengaduan <ArrowRight size={16} />
              </Button>
              <Button variant="ghost" href="/warga/pengaduan">
                Batal
              </Button>
            </div>
          </form>
        </Card>
        <aside className="stack">
          <Card className="soft">
            <h2>Laporan yang mudah ditindaklanjuti</h2>
            <p>
              <strong>Judul yang spesifik</strong>
              <br />
              <span className="muted">
                Sebutkan masalah utama dengan ringkas.
              </span>
            </p>
            <p>
              <strong>Kejadian yang jelas</strong>
              <br />
              <span className="muted">
                Ceritakan apa yang terjadi dan sejak kapan.
              </span>
            </p>
            <p>
              <strong>Lokasi mudah ditemukan</strong>
              <br />
              <span className="muted">
                Cantumkan jalan, RT/RW, dan patokan.
              </span>
            </p>
            <hr />
            <strong className="green-text">Jaga informasi pribadi</strong>
            <p className="muted small">
              Hindari nomor identitas, kata sandi, atau data pribadi yang tidak
              diperlukan.
            </p>
          </Card>
          <Alert title="Laporan berada di wilayah kelurahan">
            Penanganan mengikuti kewenangan dan waktu layanan kelurahan.
          </Alert>
        </aside>
      </div>
    </>
  );
}
function Progress({ step }: { step: number }) {
  return (
    <ol className="progress" aria-label="Tahap pengiriman">
      {["Isi laporan", "Tinjau", "Kirim"].map((t, i) => (
        <li
          key={t}
          className={step === i + 1 ? "current" : ""}
          aria-current={step === i + 1 ? "step" : undefined}
        >
          {i + 1} <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}
export function ReportReview() {
  const { draft, state, command, user, setDraft } = useDemo(),
    router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [requestId] = useState(() => crypto.randomUUID());
  if (!draft)
    return (
      <Card>
        <Empty
          title="Belum ada laporan untuk ditinjau"
          action={
            <Button href="/warga/pengaduan/buat">
              Isi laporan terlebih dahulu
            </Button>
          }
        >
          Isi formulir pengaduan sebelum melanjutkan.
        </Empty>
      </Card>
    );
  async function submit() {
    if (busy) return;
    setBusy(true);
    const result = await command({
      type: "submit",
      actorId: user!.id,
      draft: draft!,
      requestId,
    });
    if (!result.ok) {
      setError(result.error!);
      setBusy(false);
      return;
    }
    setDraft(undefined);
    router.push(`/warga/pengaduan/berhasil?id=${result.reportId}`);
  }
  return (
    <>
      <Back href="/warga/pengaduan" />
      <Heading
        eyebrow="PENGADUAN WARGA"
        title="Tinjau sebelum mengirim"
        description="Baca kembali isi laporan, lokasi, dan lampiran sebelum mengirim."
      />
      <Progress step={2} />
      <div className="two-columns">
        <Card>
          <h2>Isi laporan</h2>
          <h3>{draft.title}</h3>
          <div className="two-fields">
            <div>
              <small className="muted">Kategori</small>
              <p>{categoryName(state, draft.categoryId)}</p>
            </div>
            <div>
              <small className="muted">Lokasi kejadian</small>
              <p>{draft.location}</p>
            </div>
          </div>
          <hr />
          <small className="muted">URAIAN KEJADIAN</small>
          <p className="preserve-lines">{draft.description}</p>
          {draft.photo ? (
            <img
              className="attachment-photo"
              src={draft.photo}
              alt="Foto pendukung yang akan dikirim"
            />
          ) : (
            <p className="small muted">Tidak ada foto pendukung.</p>
          )}
        </Card>
        <aside>
          <Card>
            <h2>Siap mengirim laporan?</h2>
            <p className="muted small">
              Pastikan informasi berikut sudah sesuai.
            </p>
            <Checklist />
            <Alert title="Periksa isi laporan" tone="warning">
              Setelah dikirim, isi asli pengaduan tidak dapat diubah.
            </Alert>
            {error && (
              <Alert title="Pengiriman belum berhasil" tone="error">
                {error}
              </Alert>
            )}
            <div className="stack compact">
              <Button disabled={busy} onClick={submit}>
                {busy ? "Mengirim…" : "Kirim pengaduan"}
              </Button>
              <Button variant="secondary" href="/warga/pengaduan/buat">
                Edit laporan
              </Button>
            </div>
            <small className="muted">
              Hanya Anda dan petugas berwenang yang dapat mengakses laporan ini.
            </small>
          </Card>
        </aside>
      </div>
    </>
  );
}
export function ReportSuccess() {
  const { state, user } = useDemo(),
    params = useSearchParams();
  const report = state.reports.find(
    (r) => r.id === params.get("id") && r.userId === user!.id,
  );
  if (!report)
    return (
      <Card>
        <Empty
          title="Bukti pengiriman tidak ditemukan"
          action={<Button href="/warga/pengaduan">Ke pengaduan saya</Button>}
        />
      </Card>
    );
  return (
    <>
      <Back href="/warga/pengaduan" />
      <Card className="receipt">
        <div className="center">
          <span className="success-icon">
            <Check size={30} />
          </span>
          <h1>Pengaduan berhasil dikirim</h1>
          <p className="muted">
            Laporan Anda sudah tercatat. Simpan nomor pengaduan untuk memantau
            perkembangannya.
          </p>
        </div>
        <div className="ticket">
          <small>NOMOR PENGADUAN</small>
          <strong className="report-number">{report.number}</strong>
          <div className="row-between">
            <h3>{report.title}</h3>
            <Badge status={report.status} />
          </div>
        </div>
        <div>
          <h2>Apa selanjutnya?</h2>
          <p className="muted">
            Admin akan memeriksa laporan dan menugaskan pegawai. Buka detail
            pengaduan untuk melihat status dan tanggapan petugas.
          </p>
        </div>
        <div className="stack receipt-actions">
          <Button href={`/warga/pengaduan/${report.id}`}>
            Lihat pengaduan
          </Button>
          <Button variant="ghost" href="/warga/pengaduan">
            Ke pengaduan saya
          </Button>
        </div>
      </Card>
    </>
  );
}
export function ReportDetail({ id, role }: { id: string; role: Role }) {
  const store = useDemo(),
    router = useRouter(),
    path = usePathname(),
    params = useSearchParams(),
    r = store.state.reports.find((r) => r.id === id),
    base =
      role === "admin"
        ? "/admin/pengaduan"
        : role === "pegawai"
          ? "/pegawai/tugas"
          : "/warga/pengaduan";
  if (!r || !canRead(r, store.user!))
    return (
      <Card>
        <Empty
          title="Akses laporan tidak tersedia"
          action={<Button href={base}>Kembali ke daftar</Button>}
        >
          Laporan tidak ditemukan atau penugasan telah dialihkan.
        </Empty>
      </Card>
    );
  const terminal = r.status === "Selesai" || r.status === "Ditolak";
  const action = params.get("aksi");
  const open = (a: string) =>
    router.push(`${path}?aksi=${a}`, { scroll: false });
  const close = () => router.replace(path, { scroll: false });
  const employee = store.state.users.find(
    (u) => u.id === (r.employeeId || r.lastEmployeeId),
  );
  return (
    <>
      <Back href={base}>
        {role === "pegawai" ? "Kembali ke tugas" : "Kembali ke pengaduan"}
      </Back>
      <div className="detail-header">
        <div className="meta-row">
          <small>{r.number}</small>
          <Badge status={r.status} />
        </div>
        <h1>{r.title}</h1>
        <p className="muted small">
          {categoryName(store.state, r.categoryId)} • Dikirim{" "}
          {formatDate(r.createdAt, true)}
        </p>
      </div>
      <Alert
        title={
          r.status === "Diterima"
            ? "Menunggu pemeriksaan admin"
            : r.status === "Diproses"
              ? "Laporan sedang ditangani"
              : r.status === "Selesai"
                ? "Laporan selesai ditangani"
                : "Laporan belum dapat ditindaklanjuti"
        }
        tone={
          r.status === "Diterima"
            ? "warning"
            : r.status === "Selesai"
              ? "success"
              : r.status === "Ditolak"
                ? "error"
                : "info"
        }
      >
        {r.status === "Diterima"
          ? "Admin akan memeriksa kesesuaian laporan sebelum menugaskan pegawai."
          : r.status === "Diproses"
            ? "Petugas telah menerima penugasan dan memeriksa kondisi di lokasi."
            : r.status === "Selesai"
              ? "Hasil penanganan dapat dibaca di bawah."
              : r.rejection}
      </Alert>
      <div className="two-columns">
        <div className="stack">
          <Card>
            <h2>Isi laporan</h2>
            <h3>{r.title}</h3>
            <div className="two-fields">
              <div>
                <small className="muted">Kategori</small>
                <p>{categoryName(store.state, r.categoryId)}</p>
              </div>
              <div>
                <small className="muted">Lokasi kejadian</small>
                <p>{r.location}</p>
              </div>
            </div>
            <hr />
            <small className="muted">URAIAN KEJADIAN</small>
            <p className="preserve-lines">{r.description}</p>
            {r.photo && (
              <div className="attachment">
                <small>FOTO PENDUKUNG</small>
                {r.photo === "illustration" ? (
                  <Art kind="report" />
                ) : (
                  <img
                    className="attachment-photo"
                    src={r.photo}
                    alt="Foto pendukung laporan"
                  />
                )}
                <small>{r.photoName || "Foto pendukung"}</small>
                {r.photo === "illustration" && (
                  <small className="muted">
                    Ilustrasi contoh • foto warga saat implementasi
                  </small>
                )}
              </div>
            )}
            {role !== "warga" && (
              <>
                <hr />
                <strong>Pelapor</strong>
                <p>{store.state.users.find((u) => u.id === r.userId)?.name}</p>
                {role === "admin" && (
                  <p className="muted small">
                    {store.state.users.find((u) => u.id === r.userId)?.email} •{" "}
                    {store.state.users.find((u) => u.id === r.userId)?.phone ||
                      "Kontak tidak diisi"}
                  </p>
                )}
              </>
            )}
          </Card>
          {r.result && (
            <Card>
              <h2>Hasil penanganan</h2>
              <p className="preserve-lines">{r.result}</p>
              {r.resolvedAt && (
                <small className="muted">
                  Diselesaikan {formatDate(r.resolvedAt, true)}
                </small>
              )}
              {r.resultPhoto && (
                <img
                  className="attachment-photo"
                  src={r.resultPhoto}
                  alt="Foto hasil penanganan"
                />
              )}
            </Card>
          )}
          <Card>
            <h2>Tanggapan untuk pelapor</h2>
            {r.responses.filter((x) => !x.internal).length ? (
              r.responses
                .filter((x) => !x.internal)
                .toReversed()
                .map((x) => (
                  <article className="response" key={x.id}>
                    <div className="row-between">
                      <strong>{x.author}</strong>
                      <small className="muted">{formatDate(x.at, true)}</small>
                    </div>
                    <p className="preserve-lines">{x.text}</p>
                  </article>
                ))
            ) : (
              <p className="muted">
                Belum ada tanggapan. Perkembangan akan tampil di sini.
              </p>
            )}
          </Card>
        </div>
        <aside className="stack">
          {role !== "warga" && (
            <Card>
              <h2>
                {role === "admin" ? "Pengelolaan laporan" : "Tugas penanganan"}
              </h2>
              {terminal ? (
                <Alert title="Arsip hanya baca" tone="success">
                  Tanggapan dan status tidak dapat diubah.
                </Alert>
              ) : role === "admin" ? (
                r.status === "Diterima" ? (
                  <>
                    <Alert title="Periksa sebelum menugaskan">
                      Pastikan informasi, lokasi, dan kategori sesuai
                      kewenangan.
                    </Alert>
                    <Button onClick={() => open("setujui")}>
                      Setujui dan tugaskan
                    </Button>
                    <Button variant="danger" onClick={() => open("tolak")}>
                      Tolak pengaduan
                    </Button>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Penanggung jawab</strong>
                      <br />
                      {employee?.name}
                    </p>
                    <Button variant="secondary" onClick={() => open("alihkan")}>
                      Alihkan pegawai
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => open("internal")}
                    >
                      Catatan internal
                    </Button>
                    <Button variant="danger" onClick={() => open("tolak")}>
                      Tolak karena di luar cakupan
                    </Button>
                    <small className="muted">
                      Penyelesaian dilakukan pegawai penanggung jawab.
                    </small>
                  </>
                )
              ) : (
                <>
                  <Alert title="Ditugaskan kepada Anda">
                    Pengaduan ini sedang dalam penanganan Anda.
                  </Alert>
                  <Button onClick={() => open("tanggapan")}>
                    Tambah tanggapan
                  </Button>
                  <Button variant="secondary" onClick={() => open("internal")}>
                    Catatan internal
                  </Button>
                  <Button variant="secondary" onClick={() => open("selesai")}>
                    Selesaikan laporan
                  </Button>
                </>
              )}
            </Card>
          )}
          <Card>
            <h2>Perkembangan laporan</h2>
            <small className="muted">
              Riwayat terbaru ditampilkan di atas.
            </small>
            <ol className="timeline">
              {r.history.toReversed().map((event, i) => (
                <li
                  className={i === 0 ? "latest" : ""}
                  key={`${event.at}-${i}`}
                >
                  <strong>{event.status}</strong>
                  <small>{formatDate(event.at, true)}</small>
                  <p className="muted">{event.text}</p>
                </li>
              ))}
            </ol>
          </Card>
          {role !== "warga" && (
            <Card className="soft">
              <h3>Koordinasi internal</h3>
              <small className="muted">
                Hanya admin dan pegawai berwenang.
              </small>
              {r.responses.filter((x) => x.internal).length ? (
                r.responses
                  .filter((x) => x.internal)
                  .toReversed()
                  .map((x) => (
                    <article key={x.id}>
                      <strong>{x.author}</strong>
                      <p>{x.text}</p>
                      <small className="muted">{formatDate(x.at, true)}</small>
                    </article>
                  ))
              ) : (
                <p className="muted small">Belum ada catatan internal.</p>
              )}
              {r.assignments.length > 0 && (
                <>
                  <hr />
                  <h3>Riwayat penugasan</h3>
                  {r.assignments.toReversed().map((a, i) => (
                    <p key={i} className="small">
                      {a.employeeName}
                      <br />
                      <span className="muted">
                        {a.reason} • {formatDate(a.at)}
                      </span>
                    </p>
                  ))}
                </>
              )}
            </Card>
          )}
          <Card className="soft">
            <h3>Tentang laporan ini</h3>
            <small className="muted">Nomor pengaduan</small>
            <p className="small">{r.number}</p>
            <small className="muted">Akses laporan</small>
            <p className="small">Anda dan petugas yang berwenang</p>
            <small className="muted">
              Isi asli tersimpan sebagai catatan laporan dan tidak dapat diubah
              setelah dikirim.
            </small>
          </Card>
        </aside>
      </div>
      {action &&
        !terminal &&
        [
          "setujui",
          "tolak",
          "alihkan",
          "internal",
          "tanggapan",
          "selesai",
        ].includes(action) && (
          <ReportAction
            key={action}
            report={r}
            action={action}
            onClose={close}
          />
        )}
    </>
  );
}
function ReportAction({
  report,
  action,
  onClose,
}: {
  report: Report;
  action: string;
  onClose: () => void;
}) {
  const { state, user, command, notify } = useDemo();
  const [error, setError] = useState(""),
    [version] = useState(report.version),
    [photo, setPhoto] = useState<string>(),
    [photoError, setPhotoError] = useState("");
  const title = (
    {
      setujui: "Setujui dan tugaskan",
      tolak: "Tolak pengaduan",
      alihkan: "Alihkan penugasan",
      internal: "Catatan internal",
      tanggapan: "Tambah tanggapan",
      selesai: "Selesaikan pengaduan",
    } as Record<string, string>
  )[action];
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (photoError) return;
    const f = new FormData(e.currentTarget),
      text = String(f.get("text") || ""),
      common = { actorId: user!.id, id: report.id, version, text };
    let cmd: Command;
    if (action === "setujui" || action === "alihkan")
      cmd = {
        ...common,
        type: action === "setujui" ? "verify" : "reassign",
        employeeId: String(f.get("employee")),
      };
    else if (action === "tolak")
      cmd = { ...common, type: "reject", code: String(f.get("code")) };
    else if (action === "selesai") cmd = { ...common, type: "complete", photo };
    else cmd = { ...common, type: "respond", internal: action === "internal" };
    const result = await command(cmd);
    if (!result.ok) return setError(result.error!);
    notify("Perubahan berhasil disimpan.");
    onClose();
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <p className="muted small">
          {report.number} • {report.title}
        </p>
        {error && (
          <Alert title="Perubahan belum disimpan" tone="error">
            {error}
          </Alert>
        )}
        {["setujui", "alihkan"].includes(action) && (
          <Field label="Pegawai penanggung jawab" htmlFor="employee">
            <select id="employee" name="employee" required defaultValue="">
              <option value="">Pilih pegawai aktif</option>
              {state.users
                .filter(
                  (u) =>
                    u.role === "pegawai" &&
                    u.state === "active" &&
                    u.id !== report.employeeId,
                )
                .map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        {action === "tolak" && (
          <>
            <Alert title="Alasan dapat dibaca pelapor" tone="warning">
              Berikan alasan spesifik dan arahan yang relevan. Laporan terminal
              tidak dapat dibuka kembali pada MVP.
            </Alert>
            <Field label="Alasan penolakan" htmlFor="code">
              <select id="code" name="code" required defaultValue="">
                <option value="">Pilih alasan</option>
                <option value="outside_area">Di luar wilayah</option>
                <option value="outside_authority">Di luar kewenangan</option>
                <option value="duplicate">Laporan duplikat</option>
                <option value="incomplete">Informasi belum cukup</option>
              </select>
            </Field>
          </>
        )}
        {action === "internal" && (
          <Alert title="Khusus koordinasi internal">
            Catatan ini tidak ditampilkan kepada warga.
          </Alert>
        )}
        <Field
          label={
            action === "selesai"
              ? "Tindakan dan hasil penanganan"
              : action === "alihkan"
                ? "Alasan pengalihan"
                : action === "tolak"
                  ? "Penjelasan untuk pelapor"
                  : action === "setujui"
                    ? "Catatan verifikasi untuk pelapor"
                    : "Isi tanggapan"
          }
          htmlFor="response-text"
          hint={
            action === "tolak" || action === "selesai"
              ? "Minimal 20 karakter. Tuliskan penjelasan yang konkret."
              : "Minimal 10 karakter."
          }
        >
          <textarea
            id="response-text"
            name="text"
            rows={5}
            required
            minLength={["tolak", "selesai"].includes(action) ? 20 : 10}
            maxLength={action === "tolak" ? 1000 : 3000}
            defaultValue={
              action === "setujui"
                ? "Laporan sesuai cakupan dan ditugaskan untuk pemeriksaan di lokasi."
                : ""
            }
          />
        </Field>
        {action === "selesai" && (
          <>
            <PhotoUpload
              photo={photo}
              setPhoto={setPhoto}
              error={photoError}
              setError={setPhotoError}
            />
            <Alert title="Pastikan penanganan sudah dilakukan" tone="warning">
              Hasil ini akan ditampilkan kepada pelapor dan status menjadi
              Selesai.
            </Alert>
          </>
        )}
        <div className="actions align-end">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant={action === "tolak" ? "danger" : "primary"}
          >
            {action === "selesai" ? "Simpan hasil dan selesaikan" : title}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
