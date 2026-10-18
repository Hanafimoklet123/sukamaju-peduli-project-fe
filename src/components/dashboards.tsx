"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useDemo } from "@/lib/demo-provider";
import { API_MODE } from "@/lib/api";
import { localDate } from "@/lib/domain";
import {
  categoryName,
  chartBuckets,
  formatDate,
  visibleReports,
} from "@/lib/domain";
import { statuses, type Report, type Role } from "@/lib/types";
import { Alert, Button, Card, DataTable, Empty, Heading, Metric } from "./ui";
import { FilterPanel, ReportCards, filterReports } from "./reports";
export function PerformanceChart({
  reports,
  cohort = false,
}: {
  reports: Report[];
  cohort?: boolean;
}) {
  const today = localDate(new Date().toISOString()),
    currentYear = Number(today.slice(0, 4)),
    currentMonth = Number(today.slice(5, 7)) - 1;
  const [quarterly, setQuarterly] = useState(false),
    [year, setYear] = useState(currentYear),
    [table, setTable] = useState(false);
  const buckets = chartBuckets(reports, year, quarterly),
    peak = Math.max(5, ...buckets.flatMap((b) => [b.incoming, b.completed])),
    ceiling = Math.ceil(peak / 5) * 5;
  const total = buckets.reduce(
    (v, b) => ({
      incoming: v.incoming + b.incoming,
      completed: v.completed + b.completed,
    }),
    { incoming: 0, completed: 0 },
  );
  return (
    <Card className="performance">
      <div className="row-between">
        <div>
          <h2>{cohort ? "Laporan masuk per bulan" : "Kinerja pengaduan"}</h2>
          <p className="small muted">
            {year} • {API_MODE ? "Data layanan" : "Data contoh"}
            {cohort
              ? " sesuai filter laporan"
              : " volume masuk dan selesai per periode"}
          </p>
        </div>
        <div className="actions">
          <select
            aria-label="Tahun grafik"
            className="year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from(
              new Set([
                currentYear - 1,
                currentYear,
                currentYear + 1,
                ...reports.map((r) =>
                  Number(localDate(r.createdAt).slice(0, 4)),
                ),
              ]),
            )
              .sort()
              .map((y) => (
                <option key={y}>{y}</option>
              ))}
          </select>
          <div className="tabs" aria-label="Agregasi grafik">
            <Button
              variant={!quarterly ? "primary" : "secondary"}
              onClick={() => setQuarterly(false)}
              aria-pressed={!quarterly}
            >
              Bulanan
            </Button>
            <Button
              variant={quarterly ? "primary" : "secondary"}
              onClick={() => setQuarterly(true)}
              aria-pressed={quarterly}
            >
              Kuartalan
            </Button>
          </div>
        </div>
      </div>
      {!cohort && (
        <div className="two-fields chart-summary">
          <div className="ticket">
            <span className="muted">Laporan masuk</span>
            <strong>{total.incoming}</strong>
            <small className="muted">Dikirim pada tahun pilihan</small>
          </div>
          <div className="ticket mint">
            <span className="muted">Laporan selesai</span>
            <strong>{total.completed}</strong>
            <small className="muted">Diselesaikan pada tahun pilihan</small>
          </div>
        </div>
      )}
      <div className="chart-legend">
        <span>
          <i className="dot navy" />
          Masuk
        </span>
        {!cohort && (
          <span>
            <i className="dot green" />
            Selesai
          </span>
        )}
      </div>
      <div
        className="chart"
        role="img"
        aria-label={`Grafik ${quarterly ? "kuartalan" : "bulanan"} ${year}. ${total.incoming} masuk, ${total.completed} selesai. Tabel data tersedia di bawah.`}
      >
        <div className="chart-y">
          {[ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0].map(
            (v) => (
              <span key={v}>{Math.round(v)}</span>
            ),
          )}
        </div>
        <div className="chart-area">
          <div className="chart-lines">
            {[0, 1, 2, 3, 4].map((n) => (
              <div key={n} />
            ))}
          </div>
          <div className="chart-bars">
            {buckets.map((b, i) => (
              <div className="chart-group" key={b.label}>
                <div className="bar-pair">
                  <div className="bar-wrap">
                    <small>{b.incoming}</small>
                    <div
                      className="bar navy"
                      style={{ height: `${(b.incoming / ceiling) * 200}px` }}
                      title={`${b.label}: ${b.incoming} laporan masuk`}
                    />
                  </div>
                  {!cohort && (
                    <div className="bar-wrap">
                      <small>{b.completed}</small>
                      <div
                        className="bar green"
                        style={{ height: `${(b.completed / ceiling) * 200}px` }}
                        title={`${b.label}: ${b.completed} laporan selesai`}
                      />
                    </div>
                  )}
                </div>
                <span>
                  {b.label}
                  {year > currentYear ||
                  (year === currentYear &&
                    i >
                      (quarterly ? Math.floor(currentMonth / 3) : currentMonth))
                    ? "*"
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <small className="muted">
        {cohort
          ? "Masuk dihitung berdasarkan tanggal kirim pada kelompok filter."
          : "Masuk dihitung dari tanggal kirim; selesai dari tanggal penyelesaian. Laporan selesai dapat berasal dari periode sebelumnya."}{" "}
        * Periode belum berjalan.
      </small>
      <Button
        variant="ghost"
        onClick={() => setTable(!table)}
        aria-expanded={table}
      >
        {table ? "Sembunyikan tabel grafik" : "Lihat tabel data grafik"}
      </Button>
      {table && (
        <DataTable
          title="Data grafik"
          headers={["Periode", "Masuk", ...(!cohort ? ["Selesai"] : [])]}
          rows={buckets.map((b) => [
            b.label,
            b.incoming,
            ...(!cohort ? [b.completed] : []),
          ])}
          note="Angka yang sama dengan grafik"
        />
      )}
    </Card>
  );
}
export function Dashboard({ role }: { role: Role }) {
  const { state, user } = useDemo(),
    all = visibleReports(state, user!),
    active = all.filter((r) => ["Diterima", "Diproses"].includes(r.status));
  const base =
    role === "admin"
      ? "/admin/pengaduan"
      : role === "pegawai"
        ? "/pegawai/tugas"
        : "/warga/pengaduan";
  if (role === "warga")
    return (
      <>
        <Heading
          eyebrow="RUANG WARGA"
          title={`Selamat datang, ${user!.name.split(" ")[0]}.`}
          description="Sampaikan masalah di sekitar Anda dan pantau perkembangannya."
          action={
            <Button href="/warga/pengaduan/buat">
              <Plus size={17} />
              Buat pengaduan
            </Button>
          }
        />
        <Card className="welcome">
          <div>
            <p className="eyebrow">SETIAP LAPORAN BERARTI</p>
            <h2>
              Lingkungan lebih baik,
              <br />
              dimulai dari laporan Anda.
            </h2>
            <p className="muted">
              Ceritakan kejadian dengan jelas. Kami membantu mengarahkan
              prosesnya.
            </p>
            <Button href="/warga/pengaduan/buat">Sampaikan pengaduan</Button>
          </div>
          <ol className="mini-steps">
            <li>
              <strong>01</strong> Isi laporan
            </li>
            <li>
              <strong>02</strong> Ditangani petugas
            </li>
            <li>
              <strong>03</strong> Pantau hasilnya
            </li>
          </ol>
        </Card>
        <div className="three-grid">
          {statuses.slice(0, 3).map((s) => (
            <Metric
              key={s}
              label={s}
              value={all.filter((r) => r.status === s).length}
              note={
                s === "Diterima"
                  ? "Menunggu pemeriksaan"
                  : s === "Diproses"
                    ? "Dalam penanganan"
                    : "Hasil tersedia"
              }
            />
          ))}
        </div>
        <div className="row-between">
          <h2>Pengaduan terbaru</h2>
          <Button href={base} variant="ghost">
            Lihat semua <span aria-hidden="true">→</span>
          </Button>
        </div>
        {all.length ? (
          <ReportCards reports={all.slice(0, 3)} />
        ) : (
          <Card>
            <Empty
              title="Belum ada pengaduan"
              action={
                <Button href="/warga/pengaduan/buat">
                  Buat pengaduan pertama
                </Button>
              }
            />
          </Card>
        )}
        <Alert title="Laporan Anda bersifat pribadi">
          Hanya Anda dan petugas yang berwenang dapat membaca isi laporan.
        </Alert>
      </>
    );
  return (
    <>
      <Heading
        title={
          role === "admin"
            ? "Dashboard pelayanan"
            : `Selamat bertugas, ${user!.name.split(" ")[0]}.`
        }
        description={
          role === "admin"
            ? "Pantau antrean dan arahkan penanganan pengaduan."
            : "Prioritaskan tugas aktif dan catat perkembangan penanganan."
        }
      />
      {role === "admin" && (
        <>
          <Alert
            tone="warning"
            title={`${all.filter((r) => r.status === "Diterima").length} laporan menunggu verifikasi`}
          >
            Periksa kelengkapan dan tentukan pegawai penanggung jawab.
          </Alert>
          <div>
            <Button href="/admin/pengaduan?status=Diterima">
              Buka antrean verifikasi
            </Button>
          </div>
        </>
      )}
      <div className={role === "admin" ? "four-grid" : "three-grid"}>
        {(role === "admin"
          ? statuses
          : (["Diproses", "Selesai", "Ditolak"] as const)
        ).map((s) => (
          <Metric
            key={s}
            label={role === "pegawai" && s === "Diproses" ? "Tugas aktif" : s}
            value={all.filter((r) => r.status === s).length}
            note={
              s === "Diterima"
                ? "Menunggu verifikasi"
                : s === "Diproses"
                  ? "Sedang ditangani"
                  : s === "Selesai"
                    ? "Hasil tersedia"
                    : "Dengan alasan tercatat"
            }
          />
        ))}
      </div>
      {role === "admin" && <PerformanceChart reports={all} />}
      <DataTable
        title={
          role === "admin"
            ? "Pengaduan menunggu verifikasi"
            : "Tugas yang perlu ditindaklanjuti"
        }
        headers={["Nomor", "Pengaduan", "Kategori", "Diterima", "Aksi"]}
        rows={(role === "admin"
          ? all.filter((r) => r.status === "Diterima")
          : active
        )
          .slice(0, 4)
          .map((r) => [
            r.number,
            r.title,
            categoryName(state, r.categoryId),
            formatDate(r.createdAt),
            <Button key={r.id} href={`${base}/${r.id}`} variant="secondary">
              {role === "admin" ? "Verifikasi" : "Buka tugas"}
            </Button>,
          ])}
      />
    </>
  );
}
export function Recap() {
  const { state } = useDemo();
  const initial = {
    q: "",
    status: "",
    category: "",
    employee: "",
    from: "2026-01-01",
    to: "2026-12-31",
  };
  const [filters, setFilters] = useState(initial),
    [applied, setApplied] = useState(initial);
  const rows = filterReports(state.reports, applied),
    done = rows.filter((r) => r.status === "Selesai"),
    durations = done
      .filter((r) => r.resolvedAt)
      .map(
        (r) =>
          (new Date(r.resolvedAt!).getTime() -
            new Date(r.createdAt).getTime()) /
          86400000,
      ),
    average = durations.length
      ? (
          durations.reduce((a, b) => a + b, 0) / durations.length
        ).toLocaleString("id-ID", { maximumFractionDigits: 1 })
      : "—";
  return (
    <>
      <Heading
        title="Rekap pelayanan"
        description="Angka dihitung dari laporan yang dikirim pada periode pilihan."
      />
      <FilterPanel
        value={filters}
        setValue={setFilters}
        apply={() => setApplied(filters)}
        reset={() => {
          setFilters(initial);
          setApplied(initial);
        }}
        dates
        search={false}
        button="Tampilkan rekap"
      />
      <p className="small muted">
        Periode{" "}
        {applied.from
          ? formatDate(`${applied.from}T00:00:00+07:00`)
          : "awal data"}{" "}
        –{" "}
        {applied.to
          ? formatDate(`${applied.to}T00:00:00+07:00`)
          : "data terbaru"}{" "}
        • Total sesuai filter: {rows.length}
      </p>
      <div className="four-grid">
        {statuses.map((s) => (
          <Metric
            key={s}
            label={s}
            value={rows.filter((r) => r.status === s).length}
            note={
              s === "Diterima"
                ? "Menunggu verifikasi"
                : s === "Diproses"
                  ? "Sedang ditangani"
                  : s === "Selesai"
                    ? "Hasil tersedia"
                    : "Dengan alasan tercatat"
            }
          />
        ))}
      </div>
      <div className="three-grid">
        <Metric
          label="Rasio selesai"
          value={
            rows.length
              ? `${((done.length / rows.length) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
              : "—"
          }
          note={`${done.length} dari ${rows.length} laporan sesuai filter`}
        />
        <Metric
          label="Rata-rata selesai"
          value={`${average}${durations.length ? " hari" : ""}`}
          note={`Waktu kalender • Sampel ${durations.length}`}
        />
        <Metric
          label="Antrean aktif saat ini"
          value={
            state.reports.filter((r) =>
              ["Diterima", "Diproses"].includes(r.status),
            ).length
          }
          note="Seluruh Diterima + Diproses, tanpa filter periode"
        />
      </div>
      <PerformanceChart reports={rows} cohort />
      <DataTable
        title="Rekap per kategori"
        headers={["Kategori", "Masuk", "Selesai"]}
        rows={state.categories.map((c) => [
          c.name,
          rows.filter((r) => r.categoryId === c.id).length,
          done.filter((r) => r.categoryId === c.id).length,
        ])}
        note="Periode sesuai filter"
      />
      <small className="muted">
        Status menggunakan kondisi terkini laporan pada periode kirim. Ditolak
        tidak dihitung sebagai selesai. Grafik dashboard menggunakan tanggal
        penyelesaian untuk seri Selesai.
      </small>
    </>
  );
}
