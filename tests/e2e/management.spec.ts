import { test, expect } from "@playwright/test";
import { seed } from "../../src/lib/seed";

for (const menu of [
  { path: "/admin/kategori", entity: "categories", label: "kategori" },
  { path: "/admin/warga", entity: "citizens", label: "akun warga" },
  { path: "/admin/pegawai", entity: "employees", label: "akun pegawai" },
] as const) {
  test(`${menu.label}: pagination, konfirmasi hapus dan halaman terakhir`, async ({
    page,
  }) => {
    const state = seed();
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `item-${i}`,
      name: `Data pengujian ${i}`,
      description: "Kategori pengujian",
      active: true,
      email: `item-${i}@example.com`,
      phone: "",
      state: "active" as const,
      role:
        menu.entity === "employees" ? ("pegawai" as const) : ("warga" as const),
    }));
    if (menu.entity === "categories") state.categories = items;
    else state.users = [state.users.find((u) => u.role === "admin")!, ...items];
    const admin = state.users.find((u) => u.role === "admin")!;
    let deletes = 0;
    await page.route("**/api/**", async (route) => {
      const req = route.request();
      if (req.method() === "DELETE") {
        deletes++;
        const id = new URL(req.url()).pathname.split("/").pop();
        if (menu.entity === "categories")
          Object.assign(
            state.categories.find((c) => c.id === id)!,
            { deletedAt: new Date().toISOString(), active: false },
          );
        else
          Object.assign(
            state.users.find((u) => u.id === id)!,
            { deletedAt: new Date().toISOString(), state: "inactive" },
          );
        await route.fulfill({ json: { ok: true } });
        return;
      }
      await route.fulfill({ json: { ...state, currentUser: admin } });
    });
    await page.goto(menu.path);
    await expect(page.getByRole("button", { name: /^Hapus / })).toHaveCount(5);
    await page.getByRole("button", { name: "Halaman berikutnya" }).click();
    await expect(page.getByRole("button", { name: /^Hapus / })).toHaveCount(1);
    await page.getByRole("button", { name: /^Hapus / }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Batal", exact: true }).click();
    expect(deletes).toBe(0);
    await page.getByRole("button", { name: /^Hapus / }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", {
        name: /^(Ya, hapus|Hapus kategori|Hapus akun warga|Hapus akun pegawai)$/,
      })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Hapus / })).toHaveCount(5);
    await expect(
      page.getByRole("button", { name: "Halaman berikutnya" }),
    ).toBeDisabled();
    expect(deletes).toBe(1);
  });
}
