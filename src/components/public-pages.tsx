"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Inbox,
  Wrench,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { useDemo } from "@/lib/demo-provider";
import { home } from "@/lib/domain";
import { Alert, Back, Brand, Button, Card, Field, Heading } from "./ui";
import { Footer } from "./shell";
import { api, API_MODE, DEMO_SHORTCUTS } from "@/lib/api";
const steps = [
  [
    "Daftar atau masuk",
    "Buat akun warga. Jika sudah memiliki akun, langsung masuk.",
  ],
  [
    "Isi dan kirim laporan",
    "Tulis kejadian, kategori, dan lokasi. Tinjau sebelum mengirim.",
  ],
  [
    "Pantau perkembangannya",
    "Buka Pengaduan saya untuk melihat status dan hasil penanganan.",
  ],
];
const faqs = [
  [
    "Siapa yang bisa membuat akun?",
    "Pendaftaran mandiri tersedia untuk warga. Akun admin dan pegawai dikelola oleh pengelola.",
  ],
  [
    "Apakah pengaduan saya terlihat oleh publik?",
    "Pengaduan dapat dilihat oleh pelapor dan petugas yang berwenang. Tidak ada daftar pengaduan publik.",
  ],
  [
    "Bagaimana jika saya kesulitan masuk?",
    "Gunakan menu pemulihan akun atau hubungi pengelola layanan kelurahan.",
  ],
];
const stories = [
  {
    image: 1,
    category: "KEGIATAN LINGKUNGAN",
    title: "Bersama hadir di tengah warga",
    description:
      "Kebersamaan warga dan aparatur dalam kegiatan di lingkungan Sukamaju.",
    alt: "Warga dan aparatur berfoto bersama di depan rumah warga",
  },
  {
    image: 2,
    category: "RUANG WARGA",
    title: "Bertemu dan berbagi cerita",
    description:
      "Pertemuan menjadi ruang untuk saling menyapa dan mempererat hubungan antarwarga.",
    alt: "Warga duduk bersama dalam pertemuan di bawah kanopi",
  },
  {
    image: 3,
    category: "KEBERSAMAAN WARGA",
    title: "Dekat dengan tetangga, erat dalam kebersamaan",
    description:
      "Momen bersama warga yang menghidupkan suasana akrab di lingkungan kita.",
    alt: "Warga berfoto bersama di jalan lingkungan",
  },
  {
    image: 4,
    category: "KEGIATAN MASYARAKAT",
    title: "Meramaikan kegiatan lingkungan",
    description:
      "Warga dan petugas hadir bersama dalam kegiatan masyarakat di Sukamaju.",
    alt: "Warga dan petugas menghadiri kegiatan di halaman gedung",
  },
];

function StoryCarousel() {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const pages = [stories.slice(0, 2), stories.slice(2, 4)];
  const loopPages = [...pages, ...pages, ...pages];
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    element.scrollLeft = element.clientWidth * 2;
    let lastWheel = -Infinity;
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY))
        return;
      const direction = Math.sign(event.deltaY);
      if (!direction || !element) return;
      event.preventDefault();
      if (performance.now() - lastWheel < 500) return;
      lastWheel = performance.now();
      element.scrollBy({
        left: direction * element.clientWidth,
        behavior: "smooth",
      });
    }
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, []);
  return (
    <div
      className="story-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Cerita dari lingkungan kita"
    >
      <div
        ref={viewport}
        className={`story-viewport${dragging ? " dragging" : ""}`}
        tabIndex={0}
        onScroll={(event) => {
          const element = event.currentTarget;
          const width = element.clientWidth;
          if (!width) return;
          const offset =
            element.scrollLeft <= width + 1
              ? width * 2
              : element.scrollLeft >= width * 4 - 1
                ? -width * 2
                : 0;
          if (offset) {
            element.scrollLeft += offset;
            if (drag.current) drag.current.left += offset;
          }
        }}
        aria-label="Geser cerita ke samping dengan sentuhan, drag, scroll, atau tombol panah"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          drag.current = {
            x: event.clientX,
            left: event.currentTarget.scrollLeft,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          event.currentTarget.scrollLeft =
            drag.current.left + drag.current.x - event.clientX;
        }}
        onPointerUp={(event) => {
          if (!drag.current) return;
          drag.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
        onDragStart={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            event.currentTarget.scrollBy({
              left:
                (event.key === "ArrowRight" ? 1 : -1) *
                event.currentTarget.clientWidth,
              behavior: "smooth",
            });
          }
        }}
      >
        {loopPages.map((page, index) => (
          <div
            className="story-grid story-slide"
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${(index % pages.length) + 1} dari ${pages.length}`}
            aria-hidden={
              index < pages.length || index >= pages.length * 2
                ? true
                : undefined
            }
          >
            {page.map((story) => (
              <article key={story.image}>
                <div className="story-photo">
                  <Image
                    src={`/assets/img/sukamaju_image_${story.image}.jpg`}
                    alt={story.alt}
                    fill
                    draggable={false}
                    sizes="(max-width: 760px) calc(100vw - 88px), (max-width: 1250px) 44vw, 552px"
                  />
                </div>
                <p className="eyebrow">{story.category}</p>
                <h3>{story.title}</h3>
                <p className="muted">{story.description}</p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
export function Landing() {
  return (
    <>
      <section className="landing-section" id="beranda">
        <div className="hero">
          <div className="hero-copy">
            <p className="eyebrow">SUKAMAJU PEDULI</p>
            <h1>
              Bersama merawat
              <br />
              Sukamaju.
            </h1>
            <p className="muted">
              Sampaikan pengaduan, ikuti perkembangannya, dan kenali kehidupan
              di lingkungan kita.
            </p>
            <div className="actions">
              <Button href="/masuk?lanjut=/warga/pengaduan/buat">
                Sampaikan pengaduan
              </Button>
              <Button href="/panduan" variant="secondary">
                Lihat panduan
              </Button>
            </div>
            <small className="muted">
              Laporan ditangani admin dan pegawai sesuai kewenangan.
            </small>
          </div>
          <div className="hero-photo">
            <Image
              src="/assets/img/sukamaju_image_3.jpg"
              alt="Kebersamaan warga Sukamaju di lingkungan tempat tinggal"
              fill
              sizes="(max-width: 760px) 100vw, 48vw"
              loading="eager"
            />
          </div>
        </div>
        <div className="section-heading">
          <h2>Cerita dari lingkungan kita</h2>
          <p className="muted">
            Ruang untuk mengenalkan kegiatan warga dan potensi daerah.
          </p>
        </div>
        <StoryCarousel />
      </section>
      <section className="landing-section purpose" id="tujuan">
        <h2>
          Laporan yang jelas.
          <br />
          Penanganan yang terarah.
        </h2>
        <p className="muted">
          Sukamaju Peduli membantu warga dan kelurahan bekerja sama dalam
          pelayanan pengaduan.
        </p>
        <div className="three-grid">
          {[
            [
              "Mudah menyampaikan",
              "Laporkan kejadian dengan uraian, lokasi, dan bukti foto opsional.",
            ],
            [
              "Jelas tindak lanjutnya",
              "Admin memeriksa laporan dan menugaskan pegawai.",
            ],
            [
              "Bisa dipantau",
              "Lihat status, tanggapan, dan hasil pengaduan milik Anda.",
            ],
          ].map(([title, desc], i) => (
            <Card key={title}>
              <span className="step-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p className="muted">{desc}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="landing-section" id="panduan">
        <h2>Mulai dari tiga langkah.</h2>
        <p className="muted">
          Siapkan informasi kejadian agar laporan lebih mudah diperiksa.
        </p>
        <div className="three-grid">
          {steps.map(([title, desc], i) => (
            <Card key={title} className="soft">
              <span className="step-number">{i + 1}</span>
              <h3>{title}</h3>
              <p className="muted">{desc}</p>
            </Card>
          ))}
        </div>
        <Button href="/panduan" variant="secondary">
          Baca panduan lengkap
        </Button>
      </section>
      <section className="landing-section landing-help" id="bantuan">
        <h2>Ada yang ingin ditanyakan?</h2>
        <p>Temukan jawaban singkat sebelum membuat pengaduan.</p>
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
        <div className="help-cta">
          <div>
            <h3>Masih membutuhkan bantuan?</h3>
            <p>Temukan jawaban dan panduan pemulihan akun.</p>
          </div>
          <Button href="/bantuan" variant="secondary">
            Buka pusat bantuan
          </Button>
        </div>
        <small>
          Penanganan mengikuti jam layanan kelurahan. Bukan saluran darurat.
        </small>
      </section>
      <Footer />
    </>
  );
}
function BackToHome() {
  const { user } = useDemo();
  return <Back href={user ? home(user.role) : "/"}>Kembali ke beranda</Back>;
}

export function Guide() {
  return (
    <>
      <BackToHome />
      <Heading
        eyebrow="PANDUAN PENGADUAN"
        title="Laporan yang jelas membantu penanganan."
        description="Kenali alur dan siapkan informasi kejadian sebelum mengirim."
      />
      <div className="two-columns guide-layout">
        <div className="stack">
          {[
            [
              "Masuk atau daftar akun",
              "Gunakan akun warga untuk menyimpan dan memantau pengaduan pribadi.",
            ],
            [
              "Ceritakan satu masalah dengan jelas",
              "Tulis judul spesifik, kategori, uraian kejadian dan lokasi. Tambahkan foto jika relevan.",
            ],
            [
              "Tinjau sebelum mengirim",
              "Periksa kembali isi laporan. Setelah dikirim, isi asli pengaduan tidak dapat diubah.",
            ],
            [
              "Baca perkembangan dan hasilnya",
              "Admin memeriksa dan menugaskan pegawai. Pantau status pada Pengaduan saya.",
            ],
          ].map(([title, body], i) => (
            <Card key={title} className="guide-step">
              <span className="step-circle">{i + 1}</span>
              <div>
                <h2>{title}</h2>
                <p className="muted">{body}</p>
              </div>
            </Card>
          ))}
        </div>
        <aside className="stack">
          <Card className="soft">
            <h2>Laporan yang mudah ditindaklanjuti</h2>
            <p>
              <strong>Judul spesifik</strong>
              <br />
              <span className="muted">Misalnya Lampu jalan tidak menyala.</span>
            </p>
            <p>
              <strong>Lokasi mudah ditemukan</strong>
              <br />
              <span className="muted">
                Cantumkan jalan, RT/RW, dan patokan.
              </span>
            </p>
            <p>
              <strong>Foto opsional</strong>
              <br />
              <span className="muted">Satu JPG atau PNG maksimal 2 MB.</span>
            </p>
            <Button href="/warga/pengaduan/buat">
              Buat pengaduan <ArrowRight size={16} />
            </Button>
          </Card>
          <Alert title="Jaga informasi pribadi">
            Hindari nomor identitas, kata sandi, dan data pribadi yang tidak
            diperlukan.
          </Alert>
        </aside>
      </div>
      <Card className="status-guide">
        <div className="stack compact">
          <h2>Kenali status pengaduan</h2>
          <p className="muted">
            Dari laporan diterima hingga hasil penanganan tersedia.
          </p>
        </div>
        <ol
          className="status-timeline"
          aria-label="Tahapan penanganan pengaduan"
        >
          {[
            {
              title: "Diterima",
              description: "Laporan tersimpan dan menunggu pemeriksaan admin.",
              icon: Inbox,
              tone: "received",
            },
            {
              title: "Diproses",
              description:
                "Pegawai memeriksa dan menindaklanjuti laporan Anda.",
              icon: Wrench,
              tone: "processing",
            },
            {
              title: "Selesai",
              description:
                "Hasil penanganan telah dicatat dan dapat Anda lihat.",
              icon: CircleCheck,
              tone: "completed",
            },
          ].map(({ title, description, icon: Icon, tone }, index) => (
            <li key={title} className={`status-step ${tone}`}>
              <span className="status-marker">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div className="status-step-copy">
                <span className="status-step-number">TAHAP 0{index + 1}</span>
                <h3>{title}</h3>
                <p className="muted">{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="status-alternative">
          <span className="status-alternative-icon">
            <CircleX size={22} aria-hidden="true" />
          </span>
          <div>
            <h3>Jika laporan ditolak</h3>
            <p className="muted">
              Baca alasan dan arahan pada detail pengaduan. Jika perlu, buat
              laporan baru dengan informasi yang sudah diperbaiki.
            </p>
          </div>
        </div>
      </Card>
      <Alert title="Bukan saluran darurat" tone="warning">
        Pengiriman tersedia kapan saja. Penanganan mengikuti jam layanan
        kelurahan.
      </Alert>
    </>
  );
}
export function Help() {
  return (
    <>
      <BackToHome />
      <Heading
        title="Bantuan layanan"
        description="Temukan jawaban dan petunjuk penggunaan Sukamaju Peduli."
      />
      <div className="two-columns">
        <div className="stack">
          {[
            ...faqs,
            [
              "Bisakah saya mengubah laporan setelah dikirim?",
              "Isi asli tidak dapat diubah. Jika laporan ditolak karena informasi kurang lengkap, baca alasan dan buat laporan baru dengan perbaikan.",
            ],
            [
              "Bagaimana memantau pengaduan?",
              "Masuk, buka Pengaduan saya, lalu pilih laporan untuk membaca status dan perkembangan.",
            ],
            [
              "Apakah foto wajib?",
              "Tidak. Foto bersifat opsional dengan format JPG/PNG, maksimal 2 MB.",
            ],
          ].map(([q, a]) => (
            <details className="card faq-detail" key={q}>
              <summary>{q}</summary>
              <p className="muted">{a}</p>
            </details>
          ))}
        </div>
        <Card className="help-panel">
          <h2>Kesulitan mengakses akun?</h2>
          <p className="muted">
            Pengelola layanan membantu pemulihan setelah pemeriksaan identitas
            melalui prosedur yang disepakati.
          </p>
          <Button href="/pulihkan-akun">Panduan pemulihan</Button>
          <hr />
          <h3>Informasi layanan</h3>
          <p className="muted">
            Kontak dan jam layanan resmi akan ditambahkan setelah dikonfirmasi
            pengelola kelurahan.
          </p>
          <small className="muted">
            Jangan membagikan kata sandi kepada petugas.
          </small>
        </Card>
      </div>
    </>
  );
}
export function Privacy() {
  return (
    <>
      <BackToHome />
      <Heading
        title="Kebijakan privasi"
        description="Rancangan informasi pengelolaan data untuk layanan Sukamaju Peduli."
      />
      <Card className="prose">
        <h2>Data yang digunakan</h2>
        <p>
          Nama, email, kontak opsional, isi laporan, lokasi kejadian, dan foto
          yang Anda unggah digunakan untuk menerima dan menindaklanjuti
          pengaduan.
        </p>
        <h2>Siapa yang dapat mengakses</h2>
        <p>
          Laporan dibaca oleh pemilik, admin dan pegawai yang berwenang. Kontak
          pelapor dibatasi bagi admin. Catatan internal tidak ditampilkan kepada
          warga.
        </p>
        <h2>Isi laporan dan riwayat</h2>
        <p>
          Isi asli laporan tidak diubah setelah dikirim. Perkembangan dicatat
          sebagai tanggapan dan riwayat status terpisah.
        </p>
        <h2>Penyimpanan dan permintaan bantuan</h2>
        <p>
          Kebijakan retensi, pengelola data, kontak resmi, dan prosedur
          permintaan penghapusan perlu disahkan sebelum layanan dipublikasikan.
        </p>
        <Alert title="Versi tinjauan frontend">
          Versi ini menyimpan data contoh di browser perangkat Anda. Gunakan
          informasi fiktif saat mencoba aplikasi.
        </Alert>
      </Card>
    </>
  );
}
export function Authentication({ register = false }: { register?: boolean }) {
  const store = useDemo(),
    router = useRouter();
  const [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "")
        .trim()
        .toLowerCase(),
      password = String(data.get("password") || "");
    if (register) {
      if (password.length < 12 || password !== data.get("confirm"))
        return setError(
          "Kata sandi minimal 12 karakter dan konfirmasi harus sama.",
        );
      setBusy(true);
      const result = await store.register(
        String(data.get("name")).trim(),
        email,
        String(data.get("phone") || ""),
        password,
      );
      setBusy(false);
      if (!result.ok) return setError(result.error!);
      router.push("/warga/beranda");
      return;
    }
    setBusy(true);
    const result = await store.login(email, password);
    setBusy(false);
    if (!result.ok || !result.user)
      return setError(result.error || "Belum dapat masuk.");
    const user = result.user;
    const next = new URLSearchParams(window.location.search).get("lanjut");
    const safe =
      next?.startsWith("/warga/") &&
      !next.startsWith("//") &&
      user.role === "warga"
        ? next
        : home(user.role);
    router.push(safe);
  }
  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">SUKAMAJU PEDULI</p>
        <h1>Pelayanan yang lebih dekat dengan warga.</h1>
        <p className="muted">
          Sampaikan laporan dan ikuti proses penanganannya dalam satu tempat.
        </p>
        <div className="hero-photo">
          <Image
            src="/assets/img/sukamaju_image_1.jpg"
            alt="Warga dan aparatur Sukamaju berfoto bersama di lingkungan warga"
            fill
            loading="eager"
            sizes="(max-width: 760px) 100vw, 48vw"
          />
        </div>
        <ul className="checklist">
          {[
            "Laporan pribadi dan terarah",
            "Tindak lanjut yang dapat dipantau",
            "Hasil penanganan tercatat",
          ].map((x) => (
            <li key={x}>
              <Check size={18} />
              {x}
            </li>
          ))}
        </ul>
      </div>
      <Card className="auth-card">
        <Heading
          title={register ? "Daftar akun warga" : "Masuk ke akun Anda"}
          description={
            register
              ? "Buat akun untuk menyampaikan pengaduan."
              : "Lanjutkan untuk mengakses layanan pengaduan."
          }
        />
        {error && (
          <Alert tone="error" title="Periksa kembali">
            {error}
          </Alert>
        )}
        <form onSubmit={submit} className="stack">
          {register && (
            <Field label="Nama lengkap" htmlFor="name">
              <input
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Nama lengkap Anda"
              />
            </Field>
          )}
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="nama@example.com"
            />
          </Field>
          {register && (
            <Field label="Nomor HP" hint="Opsional" htmlFor="phone">
              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={20}
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
              />
            </Field>
          )}
          <Field
            label="Kata sandi"
            htmlFor="password"
            hint={register ? "Minimal 12 karakter." : undefined}
          >
            <div className="password-input">
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                required
                minLength={register ? 12 : 1}
                maxLength={128}
                autoComplete={register ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setShow(!show)}
                aria-label={
                  show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          {register && (
            <>
              <Field label="Konfirmasi kata sandi" htmlFor="confirm">
                <input
                  id="confirm"
                  name="confirm"
                  type={show ? "text" : "password"}
                  required
                  autoComplete="new-password"
                />
              </Field>
              <label className="checkbox">
                <input type="checkbox" required />
                Saya memahami <Link href="/privasi">
                  kebijakan privasi
                </Link>{" "}
                layanan.
              </label>
            </>
          )}
          {!register && (
            <Link className="text-link align-right" href="/pulihkan-akun">
              Lupa kata sandi?
            </Link>
          )}
          <Button type="submit" disabled={busy} className="full">
            {busy ? "Memproses…" : register ? "Daftar akun" : "Masuk"}
          </Button>
        </form>
        <p className="center small muted">
          {register ? "Sudah memiliki akun?" : "Belum memiliki akun?"}{" "}
          <Link className="text-link" href={register ? "/masuk" : "/daftar"}>
            {register ? "Masuk" : "Daftar akun warga"}
          </Link>
        </p>
        {DEMO_SHORTCUTS && (
          <div className="demo-login">
            <strong>Coba aplikasi dengan data contoh</strong>
            <p className="small muted">
              Akun data contoh untuk review lokal. Pada mode API, kata sandi
              tetap diperiksa server.
            </p>
            <div className="actions">
              {(["warga", "pegawai", "admin"] as const).map((role) => (
                <Button
                  key={role}
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const result = await store.demoLogin(role);
                    setBusy(false);
                    if (!result.ok) return setError(result.error!);
                    router.push(home(role));
                  }}
                >
                  {role === "warga"
                    ? "Warga"
                    : role === "pegawai"
                      ? "Pegawai"
                      : "Admin"}
                </Button>
              ))}
            </div>
            <small className="muted">
              Kata sandi semua akun contoh: DemoSukamaju2026!
            </small>
          </div>
        )}
      </Card>
    </div>
  );
}
export function Recovery() {
  const [done, setDone] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [token] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.hash.slice(1)).get("token") ||
        new URLSearchParams(window.location.search).get("token")
      : null,
  );
  return (
    <div className="narrow">
      <Back href="/masuk">Kembali ke masuk</Back>
      <Card>
        <Brand />
        <Heading
          title={token ? "Tentukan kata sandi Anda" : "Pemulihan akun"}
          description={
            token
              ? "Aktivasi dan pemulihan menggunakan tautan sekali pakai."
              : "Hubungi pengelola layanan melalui kanal yang telah dikonfirmasi."
          }
        />
        {token ? (
          done ? (
            <Alert
              tone="success"
              title={
                API_MODE ? "Kata sandi berhasil disimpan" : "Simulasi selesai"
              }
            >
              {API_MODE
                ? "Tautan sudah digunakan. Silakan masuk menggunakan kata sandi baru; sesi lama sudah dicabut."
                : "Kata sandi tidak disimpan dalam mode demo browser."}
            </Alert>
          ) : (
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (f.get("password") !== f.get("confirm"))
                  return setError("Konfirmasi kata sandi belum sama.");
                setBusy(true);
                setError("");
                try {
                  if (API_MODE)
                    await api("/auth/token/consume", "POST", {
                      token,
                      password: String(f.get("password")),
                    });
                  setDone(true);
                  window.history.replaceState(null, "", "/pulihkan-akun");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Belum dapat menyimpan.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Alert title={API_MODE ? "Tautan sekali pakai" : "Token demo"}>
                {API_MODE
                  ? "Tautan berlaku 30 menit. Penerbitan ulang membatalkan tautan sebelumnya. Jangan bagikan tautan ini."
                  : "Alur ini hanya simulasi pada mode demo browser."}
              </Alert>
              {error && (
                <Alert title="Belum dapat menyimpan" tone="error">
                  {error}
                </Alert>
              )}
              <Field label="Kata sandi baru" htmlFor="password">
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Konfirmasi kata sandi" htmlFor="confirm">
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  required
                  minLength={12}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                  autoComplete="new-password"
                />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? "Menyimpan…" : "Simpan kata sandi"}
              </Button>
            </form>
          )
        ) : (
          <>
            <ol className="numbered-list">
              <li>Siapkan nama dan email akun untuk pemeriksaan identitas.</li>
              <li>
                Pengelola menerbitkan tautan pemulihan setelah pemeriksaan.
              </li>
              <li>Tentukan kata sandi sendiri melalui tautan tersebut.</li>
            </ol>
            <Alert title="Jangan bagikan kata sandi">
              Admin tidak memerlukan kata sandi permanen Anda. Kontak layanan
              resmi akan ditambahkan setelah dikonfirmasi.
            </Alert>
          </>
        )}
        <Button variant="secondary" href="/masuk">
          Ke halaman masuk
        </Button>
      </Card>
    </div>
  );
}
