import { describe, expect, it } from "vitest";
import { applyCommand, canRead, chartBuckets } from "../src/lib/domain";
import { seed } from "../src/lib/seed";
const date = "2026-10-16T03:00:00Z";
const draft = {
  title: "Lampu jalan padam di gang",
  categoryId: "c1",
  description:
    "Lampu jalan sudah tidak menyala sejak tiga malam lalu dan perlu diperiksa petugas.",
  location: "Jalan Melati RT 03 RW 01",
};
describe("Alur domain pengaduan demo", () => {
  it("mengirim satu laporan tanpa foto dan retry tidak menggandakan", () => {
    const first = applyCommand(
      seed(),
      { type: "submit", actorId: "w1", draft, requestId: "request1" },
      date,
    );
    expect(first.result.ok).toBe(true);
    expect(first.state.reports[0].status).toBe("Diterima");
    expect(first.state.reports[0].employeeId).toBeUndefined();
    const retry = applyCommand(
      first.state,
      { type: "submit", actorId: "w1", draft, requestId: "request1" },
      date,
    );
    expect(retry.state.reports.length).toBe(first.state.reports.length);
    expect(retry.state.reports[0].history).toHaveLength(1);
  });
  it("menolak kirim kategori nonaktif tanpa mengubah data", () => {
    const s = seed();
    s.categories[0].active = false;
    const r = applyCommand(
      s,
      { type: "submit", actorId: "w1", draft, requestId: "no" },
      date,
    );
    expect(r.result.ok).toBe(false);
    expect(r.state).toBe(s);
  });
  it("approve membuat satu tugas dan menolak versi lama", () => {
    const cmd = {
      type: "verify" as const,
      actorId: "a1",
      id: "126",
      version: 1,
      employeeId: "p1",
      text: "Laporan sesuai kewenangan dan perlu diperiksa.",
    };
    const first = applyCommand(seed(), cmd, date),
      r = first.state.reports.find((r) => r.id === "126")!;
    expect(r.status).toBe("Diproses");
    expect(r.assignments.filter((a) => !a.endedAt)).toHaveLength(1);
    expect(applyCommand(first.state, cmd, date).result.error).toContain(
      "diperbarui",
    );
  });
  it("pengalihan mencabut akses pegawai lama dan mempertahankan satu tugas", () => {
    const r = applyCommand(
      seed(),
      {
        type: "reassign",
        actorId: "a1",
        id: "124",
        version: 1,
        employeeId: "p2",
        text: "Pengalihan karena pegawai sebelumnya berhalangan.",
      },
      date,
    );
    const report = r.state.reports.find((r) => r.id === "124")!;
    expect(report.status).toBe("Diproses");
    expect(report.assignments.filter((a) => !a.endedAt)).toHaveLength(1);
    expect(
      canRead(
        report,
        r.state.users.find((u) => u.id === "p1")!,
      ),
    ).toBe(false);
    expect(
      canRead(
        report,
        r.state.users.find((u) => u.id === "p2")!,
      ),
    ).toBe(true);
  });
  it("penyelesaian harus oleh penanggung jawab dan menjadi arsip baca", () => {
    const s = seed();
    const bad = applyCommand(
      s,
      {
        type: "complete",
        actorId: "a1",
        id: "124",
        version: 1,
        text: "Lampu telah diperbaiki dan kembali menyala normal.",
      },
      date,
    );
    expect(bad.result.ok).toBe(false);
    const good = applyCommand(
      s,
      {
        type: "complete",
        actorId: "p1",
        id: "124",
        version: 1,
        text: "Lampu telah diperbaiki dan kembali menyala normal.",
      },
      date,
    );
    const report = good.state.reports.find((r) => r.id === "124")!;
    expect(report.status).toBe("Selesai");
    expect(report.assignments.filter((a) => !a.endedAt)).toHaveLength(0);
    expect(
      canRead(
        report,
        good.state.users.find((u) => u.id === "p1")!,
      ),
    ).toBe(true);
    expect(
      applyCommand(
        good.state,
        {
          type: "respond",
          actorId: "p1",
          id: "124",
          version: 2,
          text: "Perubahan sesudah selesai.",
          internal: false,
        },
        date,
      ).result.ok,
    ).toBe(false);
  });
  it("warga tidak dapat membaca laporan lain atau melakukan verifikasi", () => {
    const s = seed();
    expect(
      canRead(
        s.reports.find((r) => r.userId === "w2")!,
        s.users[0],
      ),
    ).toBe(false);
    expect(
      applyCommand(
        s,
        {
          type: "verify",
          actorId: "w1",
          id: "126",
          version: 1,
          employeeId: "p1",
          text: "Mencoba menugaskan laporan.",
        },
        date,
      ).result.ok,
    ).toBe(false);
  });
  it("pegawai dengan tugas aktif tidak dapat dinonaktifkan", () => {
    expect(
      applyCommand(
        seed(),
        {
          type: "employee",
          actorId: "a1",
          id: "p1",
          name: "Rina Wulandari",
          email: "rina.contoh@example.com",
          active: false,
        },
        date,
      ).result.error,
    ).toContain("Alihkan");
  });
  it("nama kategori historis tetap, nonaktif tetap menyimpan laporan", () => {
    const s = seed();
    expect(
      applyCommand(
        s,
        {
          type: "category",
          actorId: "a1",
          id: "c1",
          name: "Nama baru",
          description: "Contoh",
          active: false,
        },
        date,
      ).result.ok,
    ).toBe(false);
    const r = applyCommand(
      s,
      {
        type: "category",
        actorId: "a1",
        id: "c1",
        name: s.categories[0].name,
        description: "Keterangan terbaru",
        active: false,
      },
      date,
    );
    expect(r.result.ok).toBe(true);
    expect(r.state.reports).toHaveLength(s.reports.length);
  });
  it("grafik event membedakan bulan dibuat dan bulan selesai", () => {
    const s = seed(),
      r = s.reports[0];
    r.createdAt = "2026-09-30T12:00:00Z";
    r.resolvedAt = "2026-10-02T12:00:00Z";
    r.status = "Selesai";
    const b = chartBuckets([r], 2026, false);
    expect(b[8]).toMatchObject({ incoming: 1, completed: 0 });
    expect(b[9]).toMatchObject({ incoming: 0, completed: 1 });
    expect(chartBuckets([r], 2026, true)[3].completed).toBe(1);
  });
});

describe("Penghapusan data pengelolaan", () => {
  it("menghapus kategori dari pengelolaan tanpa menghapus referensi laporan", () => {
    const s = seed();
    const result = applyCommand(
      s,
      { type: "delete", entity: "categories", actorId: "a1", id: "c1" },
      date,
    );
    expect(result.result.ok).toBe(true);
    expect(result.state.categories.find((c) => c.id === "c1")?.deletedAt).toBe(
      date,
    );
    expect(result.state.categories.find((c) => c.id === "c1")?.active).toBe(
      false,
    );
    expect(result.state.reports.length).toBe(s.reports.length);
    expect(s.categories.find((c) => c.id === "c1")?.deletedAt).toBeUndefined();
  });
  it("menghapus akun warga dengan mempertahankan laporan", () => {
    const s = seed();
    const result = applyCommand(
      s,
      { type: "delete", entity: "citizens", actorId: "a1", id: "w1" },
      date,
    );
    expect(result.result.ok).toBe(true);
    expect(result.state.users.find((u) => u.id === "w1")?.state).toBe(
      "inactive",
    );
    expect(result.state.users.find((u) => u.id === "w1")?.deletedAt).toBe(date);
    expect(result.state.reports.length).toBe(s.reports.length);
    expect(
      applyCommand(
        result.state,
        { type: "submit", actorId: "w1", draft, requestId: "deleted" },
        date,
      ).result.ok,
    ).toBe(false);
  });
  it("menolak pengguna nonadmin dan pegawai yang masih bertugas", () => {
    const s = seed();
    expect(
      applyCommand(
        s,
        { type: "delete", entity: "categories", actorId: "w1", id: "c1" },
        date,
      ).result.ok,
    ).toBe(false);
    const task = s.reports.find((r) => r.status === "Diproses" && r.employeeId);
    expect(task).toBeDefined();
    const result = applyCommand(
      s,
      {
        type: "delete",
        entity: "employees",
        actorId: "a1",
        id: task!.employeeId!,
      },
      date,
    );
    expect(result.result.ok).toBe(false);
    expect(result.result.error).toContain("tugas aktif");
    expect(result.state).toBe(s);
  });
});
