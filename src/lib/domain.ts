import type {
  Command,
  DemoState,
  MutationResult,
  Report,
  Role,
  User,
} from "./types";

export function canRead(report: Report, user: User): boolean {
  return (
    user.state === "active" &&
    (user.role === "admin" ||
      (user.role === "warga" && report.userId === user.id) ||
      (user.role === "pegawai" &&
        (report.status === "Diproses"
          ? report.employeeId === user.id
          : ["Selesai", "Ditolak"].includes(report.status) &&
            report.lastEmployeeId === user.id)))
  );
}
export function home(role: Role) {
  return `/${role === "admin" ? "admin" : role === "pegawai" ? "pegawai" : "warga"}/beranda`;
}
export function localDate(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((key) => parts.find((p) => p.type === key)!.value)
    .join("-");
}
export function categoryName(state: DemoState, id: string) {
  return (
    state.categories.find((c) => c.id === id)?.name ?? "Kategori tidak tersedia"
  );
}
export function visibleReports(state: DemoState, user: User) {
  return state.reports.filter((r) => canRead(r, user));
}
export function formatDate(value: string, time = false) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}
export function validateDraft(d: {
  title: string;
  description: string;
  location: string;
  categoryId: string;
}) {
  const errors: Record<string, string> = {};
  if (d.title.trim().length < 10 || d.title.trim().length > 150)
    errors.title = "Judul harus 10–150 karakter.";
  if (d.description.trim().length < 30 || d.description.trim().length > 5000)
    errors.description = "Uraian harus 30–5.000 karakter.";
  if (d.location.trim().length < 5 || d.location.trim().length > 255)
    errors.location = "Lokasi harus 5–255 karakter.";
  if (!d.categoryId) errors.categoryId = "Pilih kategori laporan.";
  return errors;
}
export function applyCommand(
  current: DemoState,
  cmd: Command,
  now = new Date().toISOString(),
): { state: DemoState; result: MutationResult } {
  const fail = (error: string) => ({
    state: current,
    result: { ok: false, error },
  });
  const actor = current.users.find(
    (u) => u.id === cmd.actorId && u.state === "active",
  );
  if (!actor) return fail("Sesi tidak aktif. Silakan masuk kembali.");
  if (cmd.type === "submit") {
    const existing = current.reports.find(
      (r) => r.id === cmd.requestId && r.userId === actor.id,
    );
    if (existing)
      return { state: current, result: { ok: true, reportId: existing.id } };
    if (actor.role !== "warga")
      return fail("Hanya warga dapat membuat pengaduan.");
    if (Object.keys(validateDraft(cmd.draft)).length)
      return fail("Periksa kembali isian laporan.");
    if (
      !current.categories.some((c) => c.id === cmd.draft.categoryId && c.active)
    )
      return fail("Kategori sudah tidak aktif. Pilih kategori lain.");
    const state = structuredClone(current);
    const seq =
      Math.max(
        0,
        ...state.reports.map((r) => Number(r.number.split("-").at(-1))),
      ) + 1;
    state.reports.unshift({
      id: cmd.requestId,
      number: `SM-${new Date(now).getFullYear()}-${String(seq).padStart(5, "0")}`,
      userId: actor.id,
      title: cmd.draft.title.trim(),
      description: cmd.draft.description.trim(),
      location: cmd.draft.location.trim(),
      categoryId: cmd.draft.categoryId,
      status: "Diterima",
      version: 1,
      createdAt: now,
      assignments: [],
      responses: [],
      history: [
        {
          status: "Diterima",
          at: now,
          text: "Laporan tersimpan dan masuk antrean pemeriksaan admin.",
        },
      ],
      photo: cmd.draft.photo,
      photoName: cmd.draft.photoName,
    });
    return { state, result: { ok: true, reportId: cmd.requestId } };
  }
  if (
    ["verify", "reject", "reassign", "respond", "complete"].includes(cmd.type)
  ) {
    if (!("version" in cmd)) return fail("Perintah tidak dikenal.");
    const original = current.reports.find((r) => r.id === cmd.id);
    if (!original || !canRead(original, actor))
      return fail("Akses tidak tersedia atau penugasan telah dialihkan.");
    if (original.version !== cmd.version)
      return fail(
        "Laporan telah diperbarui. Muat ulang data sebelum melanjutkan.",
      );
    if (["Selesai", "Ditolak"].includes(original.status))
      return fail("Laporan ini sudah menjadi arsip hanya baca.");
    if (
      cmd.text.trim().length <
      (cmd.type === "complete" || cmd.type === "reject" ? 20 : 10)
    )
      return fail("Berikan penjelasan yang lebih lengkap.");
    if (cmd.text.length > (cmd.type === "reject" ? 1000 : 3000))
      return fail("Penjelasan melebihi batas karakter.");
    if (
      ["verify", "reject", "reassign"].includes(cmd.type) &&
      actor.role !== "admin"
    )
      return fail("Aksi ini hanya tersedia untuk admin.");
    if (cmd.type === "verify" && original.status !== "Diterima")
      return fail("Hanya laporan Diterima dapat diverifikasi.");
    if (cmd.type === "reassign" && original.status !== "Diproses")
      return fail("Hanya laporan Diproses dapat dialihkan.");
    if (
      cmd.type === "complete" &&
      (actor.role !== "pegawai" || original.employeeId !== actor.id)
    )
      return fail(
        "Hanya pegawai penanggung jawab aktif yang dapat menyelesaikan.",
      );
    if (
      cmd.type === "respond" &&
      (original.status !== "Diproses" ||
        (actor.role === "admin" && !cmd.internal) ||
        (actor.role !== "admin" &&
          !(actor.role === "pegawai" && original.employeeId === actor.id)))
    )
      return fail("Tanggapan tidak diizinkan untuk akun atau status ini.");
    if (cmd.type === "reject" && !cmd.code)
      return fail("Pilih alasan penolakan.");
    let employee: User | undefined;
    if (cmd.type === "verify" || cmd.type === "reassign") {
      employee = current.users.find(
        (u) =>
          u.id === cmd.employeeId &&
          u.role === "pegawai" &&
          u.state === "active",
      );
      if (!employee) return fail("Pilih pegawai aktif yang tersedia.");
      if (original.employeeId === employee.id)
        return fail("Pilih pegawai yang berbeda.");
    }
    const state = structuredClone(current),
      r = state.reports.find((r) => r.id === cmd.id)!;
    if (cmd.type === "verify" || cmd.type === "reassign") {
      for (const a of r.assignments) if (!a.endedAt) a.endedAt = now;
      r.assignments.push({
        employeeId: employee!.id,
        employeeName: employee!.name,
        assignedBy: actor.name,
        at: now,
        reason: cmd.text.trim(),
      });
      r.employeeId = employee!.id;
      r.lastEmployeeId = employee!.id;
      if (cmd.type === "verify") {
        r.status = "Diproses";
        r.history.push({ status: "Diproses", at: now, text: cmd.text.trim() });
      }
    }
    if (cmd.type === "reject" || cmd.type === "complete") {
      for (const a of r.assignments) if (!a.endedAt) a.endedAt = now;
      r.employeeId = undefined;
      if (cmd.type === "complete") {
        r.status = "Selesai";
        r.resolvedAt = now;
        r.result = cmd.text.trim();
        r.resultPhoto = cmd.photo;
      } else {
        r.status = "Ditolak";
        r.rejection = cmd.text.trim();
        r.rejectionCode = cmd.code;
      }
      r.history.push({ status: r.status, at: now, text: cmd.text.trim() });
    }
    r.responses.push({
      id: `${r.id}-${r.version + 1}`,
      authorId: actor.id,
      author: actor.name,
      at: now,
      text: cmd.text.trim(),
      internal:
        cmd.type === "reassign" || (cmd.type === "respond" && cmd.internal),
      kind:
        cmd.type === "complete"
          ? "hasil"
          : cmd.type === "reject"
            ? "penolakan"
            : cmd.type === "verify"
              ? "verifikasi"
              : cmd.type === "reassign" ||
                  (cmd.type === "respond" && cmd.internal)
                ? "internal"
                : "perkembangan",
    });
    r.version++;
    state.audits.unshift({
      id: `${now}-${cmd.type}`,
      at: now,
      actor: actor.name,
      action:
        cmd.type === "verify" || cmd.type === "reassign"
          ? "Penugasan"
          : cmd.type === "reject"
            ? "Penolakan"
            : cmd.type === "complete"
              ? "Penyelesaian"
              : "Tanggapan",
      object: r.number,
      reason:
        cmd.type === "respond" && cmd.internal
          ? "Catatan koordinasi internal ditambahkan"
          : cmd.text.trim().slice(0, 200),
    });
    return { state, result: { ok: true, reportId: r.id } };
  }
  if (cmd.type !== "profile" && actor.role !== "admin")
    return fail("Hanya admin dapat mengelola data ini.");
  const state = structuredClone(current);
  if (cmd.type === "employee") {
    if (
      cmd.name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cmd.email)
    )
      return fail("Nama dan email pegawai harus valid.");
    if (
      state.users.some(
        (u) =>
          u.id !== cmd.id &&
          u.email.toLowerCase() === cmd.email.trim().toLowerCase(),
      )
    )
      return fail("Email sudah digunakan.");
    if (cmd.id) {
      const target = state.users.find(
        (u) => u.id === cmd.id && u.role === "pegawai",
      );
      if (!target) return fail("Pegawai tidak ditemukan.");
      if (
        !cmd.active &&
        state.reports.some(
          (r) => r.employeeId === cmd.id && r.status === "Diproses",
        )
      )
        return fail(
          "Alihkan seluruh tugas aktif sebelum menonaktifkan pegawai.",
        );
      target.name = cmd.name.trim();
      target.state = cmd.active ? "active" : "inactive";
    } else
      state.users.push({
        id: `p-${now}`,
        name: cmd.name.trim(),
        email: cmd.email.trim().toLowerCase(),
        phone: "",
        role: "pegawai",
        state: "pending",
      });
  } else if (cmd.type === "category") {
    if (
      cmd.name.trim().length < 2 ||
      cmd.name.trim().length > 50 ||
      cmd.description.length > 255
    )
      return fail(
        "Nama kategori 2–50 karakter dan deskripsi maksimal 255 karakter.",
      );
    if (
      state.categories.some(
        (c) =>
          c.id !== cmd.id &&
          c.name.toLowerCase() === cmd.name.trim().toLowerCase(),
      )
    )
      return fail("Nama kategori sudah digunakan.");
    const target = state.categories.find((c) => c.id === cmd.id);
    if (cmd.id && !target) return fail("Kategori tidak ditemukan.");
    if (target) {
      if (
        state.reports.some((r) => r.categoryId === target.id) &&
        target.name !== cmd.name.trim()
      )
        return fail("Nama kategori yang telah dipakai tidak dapat diubah.");
      Object.assign(target, {
        name: cmd.name.trim(),
        description: cmd.description.trim(),
        active: cmd.active,
      });
    } else
      state.categories.push({
        id: `c-${now}`,
        name: cmd.name.trim(),
        description: cmd.description.trim(),
        active: cmd.active,
      });
  } else if (cmd.type === "profile") {
    if (
      cmd.name.trim().length < 2 ||
      cmd.name.trim().length > 100 ||
      (cmd.phone && !/^\+?[0-9\s-]{8,20}$/.test(cmd.phone))
    )
      return fail("Periksa nama dan nomor kontak.");
    Object.assign(
      state.users.find((u) => u.id === actor.id)!,
      { name: cmd.name.trim(), phone: cmd.phone.trim() },
    );
  } else if (cmd.type === "recover") {
    if (
      !state.users.some((u) => u.id === cmd.userId) ||
      cmd.reason.trim().length < 20
    )
      return fail("Pilih akun dan tuliskan dasar pemeriksaan identitas.");
  }
  if (cmd.type !== "profile")
    state.audits.unshift({
      id: `${now}-${cmd.type}`,
      at: now,
      actor: actor.name,
      action:
        cmd.type === "category"
          ? "Kategori"
          : cmd.type === "recover"
            ? "Pemulihan akun"
            : "Akun pegawai",
      object: "name" in cmd ? cmd.name : "userId" in cmd ? cmd.userId : "",
      reason:
        cmd.type === "recover"
          ? "Token pemulihan demo diterbitkan setelah pemeriksaan identitas"
          : "Pengelolaan data layanan",
    });
  return { state, result: { ok: true } };
}
export function chartBuckets(
  reports: Report[],
  year: number,
  quarterly: boolean,
) {
  return Array.from({ length: quarterly ? 4 : 12 }, (_, i) => {
    const matches = (date?: string) => {
      if (!date) return false;
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
      }).formatToParts(new Date(date));
      const y = Number(parts.find((p) => p.type === "year")!.value),
        month = Number(parts.find((p) => p.type === "month")!.value) - 1;
      return y === year && (quarterly ? Math.floor(month / 3) : month) === i;
    };
    return {
      label: quarterly
        ? `Q${i + 1}`
        : [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des",
          ][i],
      incoming: reports.filter((r) => matches(r.createdAt)).length,
      completed: reports.filter(
        (r) => r.status === "Selesai" && matches(r.resolvedAt),
      ).length,
    };
  });
}
