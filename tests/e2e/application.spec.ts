import { test, expect, type Page } from "@playwright/test";
const login = async (page: Page, role: string) => {
  await visit(page, "/masuk");
  await page.getByRole("button", { name: role, exact: true }).click();
  await expect(page).toHaveURL(/beranda/);
};
async function fixtureId(page: Page, key: string) {
  const response = await page.request.get("/api/workspace");
  if (!response.ok()) return key; // Browser-only demo mode.
  const data = await response.json();
  const match =
    key === "c1"
      ? data.categories.find(
          (c: { name: string }) => c.name === "Infrastruktur lingkungan",
        )
      : key === "p1"
        ? data.users.find(
            (u: { email: string }) => u.email === "rina.contoh@example.com",
          )
        : key === "w1"
          ? data.users.find(
              (u: { email: string }) => u.email === "ahmad.contoh@example.com",
            )
          : data.reports.find(
              (r: { number: string }) =>
                r.number === `SM-2026-${key.padStart(5, "0")}`,
            );
  if (!match)
    throw new Error(`Data contoh ${key} tidak tersedia. Gunakan seed review.`);
  return match.id as string;
}
async function visit(page: Page, path: string) {
  const key = path.match(/\/(124|126|103|p1|w1|c1)(?=\/|$)/)?.[1];
  await page.goto(
    key ? path.replace(`/${key}`, `/${await fixtureId(page, key)}`) : path,
  );
}

test("alur warga ke admin ke pegawai ke hasil warga", async ({ page }) => {
  await login(page, "Warga");
  await visit(page, "/warga/pengaduan/buat");
  await page
    .getByLabel("Judul pengaduan *")
    .fill("Lampu gang review integrasi frontend");
  await page.getByLabel("Kategori *").selectOption(await fixtureId(page, "c1"));
  await page
    .getByLabel("Uraian kejadian *")
    .fill(
      "Lampu di dekat balai warga padam sejak tiga malam lalu. Mohon pengecekan dan penanganan.",
    );
  await page
    .getByLabel("Alamat atau patokan lokasi *")
    .fill("Jalan Melati RT 03 RW 01 depan balai warga");
  await page.getByRole("button", { name: /Tinjau pengaduan/ }).click();
  await expect(
    page.getByRole("heading", { name: "Tinjau sebelum mengirim" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit laporan", exact: true }).click();
  await expect(page.getByLabel("Judul pengaduan *")).toHaveValue(
    "Lampu gang review integrasi frontend",
  );
  await page.getByRole("button", { name: /Tinjau pengaduan/ }).click();
  await page
    .getByRole("button", { name: "Kirim pengaduan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pengaduan berhasil dikirim" }),
  ).toBeVisible();
  const id = new URL(page.url()).searchParams.get("id");
  expect(id).toBeTruthy();
  await login(page, "Admin");
  await visit(page, `/admin/pengaduan/${id}`);
  await page
    .getByRole("button", { name: "Setujui dan tugaskan", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Pegawai penanggung jawab")
    .selectOption(await fixtureId(page, "p1"));
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Setujui dan tugaskan", exact: true })
    .click();
  await expect(
    page.getByText("Laporan sedang ditangani", { exact: true }),
  ).toBeVisible();
  await login(page, "Pegawai");
  await visit(page, `/pegawai/tugas/${id}`);
  await page
    .getByRole("button", { name: "Catatan internal", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Isi tanggapan")
    .fill("Catatan rahasia koordinasi tim review saja.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Catatan internal", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Selesaikan laporan", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Tindakan dan hasil penanganan")
    .fill(
      "Kabel telah diganti dan lampu kembali menyala setelah diuji petugas di lokasi.",
    );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Simpan hasil dan selesaikan" })
    .click();
  await expect(
    page.getByText("Laporan selesai ditangani", { exact: true }),
  ).toBeVisible();
  await login(page, "Warga");
  await visit(page, `/warga/pengaduan/${id}`);
  await expect(
    page.getByRole("heading", { name: "Hasil penanganan", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Catatan rahasia koordinasi tim review saja."),
  ).toHaveCount(0);
});
test("halaman publik serta semua menu role dapat ditampilkan", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/panduan",
    "/bantuan",
    "/privasi",
    "/masuk",
    "/daftar",
    "/pulihkan-akun",
    "/review",
    "/status/konflik",
    "/status/akses-ditolak",
    "/status/sesi",
    "/status/tidak-ditemukan",
  ]) {
    await visit(page, route);
    await expect(page.locator("main h1").first()).toBeVisible();
  }
  for (const [role, routes] of [
    [
      "Warga",
      [
        "/warga/beranda",
        "/warga/pengaduan",
        "/warga/pengaduan/buat",
        "/warga/pengaduan/124",
        "/warga/pengaduan/103",
        "/akun",
      ],
    ],
    [
      "Pegawai",
      [
        "/pegawai/beranda",
        "/pegawai/tugas",
        "/pegawai/tugas/124",
        "/pegawai/tugas/103",
        "/akun",
      ],
    ],
    [
      "Admin",
      [
        "/admin/beranda",
        "/admin/pengaduan",
        "/admin/pengaduan/126",
        "/admin/pegawai",
        "/admin/pegawai/baru",
        "/admin/pegawai/p1",
        "/admin/warga",
        "/admin/warga/w1/pulihkan",
        "/admin/kategori",
        "/admin/kategori/baru",
        "/admin/kategori/c1/ubah",
        "/admin/rekap",
        "/admin/audit",
        "/akun",
      ],
    ],
  ] as const) {
    await login(page, role);
    for (const route of routes) {
      await visit(page, route);
      await expect(page.locator("main h1").first()).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
test("mobile tidak melebar dan menu dapat dinavigasi", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/panduan", "/masuk"]) {
    await visit(page, route);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await login(page, "Admin");
  for (const route of [
    "/admin/beranda",
    "/admin/pengaduan",
    "/admin/pegawai",
    "/admin/kategori",
    "/admin/kategori/c1/ubah",
    "/admin/rekap",
    "/admin/audit",
  ]) {
    await visit(page, route);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Navigasi mobile" }),
  ).toBeVisible();
});
test("pencarian kosong, modal aksesibel, dan grafik kuartalan", async ({
  page,
}) => {
  await login(page, "Admin");
  await visit(page, "/admin/pengaduan");
  await page.getByLabel("Cari", { exact: true }).fill("tidak-ada-data-ini");
  await page
    .getByRole("button", { name: "Terapkan filter", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tidak ada hasil pencarian" }),
  ).toBeVisible();
  await visit(page, "/admin/beranda");
  await page.getByRole("button", { name: "Kuartalan", exact: true }).click();
  await expect(page.getByText("Q1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Lihat tabel data grafik" }).click();
  await expect(
    page.getByRole("heading", { name: "Data grafik" }),
  ).toBeVisible();
  await visit(page, "/admin/pengaduan/126");
  await page
    .getByRole("button", { name: "Setujui dan tugaskan", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
