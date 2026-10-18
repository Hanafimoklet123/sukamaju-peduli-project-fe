import type { DemoState, Report, Status } from "./types";
export const initialState: DemoState = {
  schema: 1,
  users: [
    {
      id: "w1",
      name: "Ahmad Pratama",
      email: "ahmad.contoh@example.com",
      phone: "081234567890",
      role: "warga",
      state: "active",
    },
    {
      id: "w2",
      name: "Siti Aminah",
      email: "siti.contoh@example.com",
      phone: "081234567891",
      role: "warga",
      state: "active",
    },
    {
      id: "w3",
      name: "Dian Putri",
      email: "dian.contoh@example.com",
      phone: "081234567892",
      role: "warga",
      state: "active",
    },
    {
      id: "p1",
      name: "Rina Wulandari",
      email: "rina.contoh@example.com",
      phone: "081234567893",
      role: "pegawai",
      state: "active",
    },
    {
      id: "p2",
      name: "Budi Santoso",
      email: "budi.contoh@example.com",
      phone: "081234567894",
      role: "pegawai",
      state: "active",
    },
    {
      id: "p3",
      name: "Dewi Lestari",
      email: "dewi.contoh@example.com",
      phone: "",
      role: "pegawai",
      state: "pending",
    },
    {
      id: "a1",
      name: "Admin Kelurahan",
      email: "admin.contoh@example.com",
      phone: "081234567895",
      role: "admin",
      state: "active",
    },
  ],
  categories: [
    {
      id: "c1",
      name: "Infrastruktur lingkungan",
      description: "Lampu jalan, saluran air, dan sarana umum lingkungan.",
      active: true,
    },
    {
      id: "c2",
      name: "Kebersihan",
      description: "Sampah dan kebersihan area sekitar.",
      active: true,
    },
    {
      id: "c3",
      name: "Ketertiban lingkungan",
      description: "Gangguan ketertiban lingkungan.",
      active: true,
    },
    {
      id: "c4",
      name: "Pelayanan administrasi",
      description: "Keluhan tentang proses pelayanan kelurahan.",
      active: true,
    },
  ],
  reports: [],
  audits: [
    {
      id: "au1",
      at: "2026-10-07T09:30:00+07:00",
      actor: "Admin Kelurahan",
      action: "Penugasan",
      object: "SM-2026-00124",
      reason: "Sesuai kewenangan penanganan",
    },
    {
      id: "au2",
      at: "2026-10-07T08:45:00+07:00",
      actor: "Admin Kelurahan",
      action: "Kategori",
      object: "Infrastruktur lingkungan",
      reason: "Perjelas deskripsi kategori",
    },
    {
      id: "au3",
      at: "2026-10-06T15:00:00+07:00",
      actor: "Admin Kelurahan",
      action: "Akun pegawai",
      object: "Dewi Lestari",
      reason: "Penambahan petugas",
    },
  ],
};
function report(
  id: string,
  title: string,
  status: Status,
  categoryId: string,
  day: string,
  employeeId?: string,
  userId = "w1",
): Report {
  const date = `2026-${day}T16:20:00+07:00`,
    assignedAt = `2026-${day}T17:20:00+07:00`;
  const name = employeeId === "p2" ? "Budi Santoso" : "Rina Wulandari";
  return {
    id,
    number: `SM-2026-${id.padStart(5, "0")}`,
    userId,
    title,
    description: title.startsWith("Lampu")
      ? "Lampu jalan di depan gang dekat balai warga tidak menyala sejak tiga malam lalu. Kondisi jalan menjadi gelap saat warga pulang pada malam hari. Mohon dilakukan pemeriksaan."
      : `${title} di lingkungan sekitar tempat tinggal warga. Kondisi ini mengganggu kegiatan sehari-hari. Mohon dilakukan pemeriksaan dan tindak lanjut sesuai kewenangan kelurahan.`,
    location: "Jalan Melati, RT 03/RW 01, depan gang dekat balai warga.",
    categoryId,
    status,
    createdAt: date,
    version: 1,
    employeeId: status === "Diproses" ? employeeId : undefined,
    lastEmployeeId: employeeId,
    assignments: employeeId
      ? [
          {
            employeeId,
            employeeName: name,
            assignedBy: "Admin Kelurahan",
            at: assignedAt,
            reason: "Sesuai kewenangan",
            endedAt: status === "Selesai" ? assignedAt : undefined,
          },
        ]
      : [],
    responses:
      status === "Diproses"
        ? [
            {
              id: `r${id}`,
              authorId: employeeId!,
              author: name,
              text: "Petugas meninjau lokasi dan menjadwalkan pemeriksaan.",
              internal: false,
              kind: "perkembangan",
              at: assignedAt,
            },
          ]
        : [],
    history: [
      {
        status: "Diterima",
        at: date,
        text: "Laporan tersimpan dan masuk antrean pemeriksaan admin.",
      },
      ...(status !== "Diterima"
        ? [
            {
              status,
              at: assignedAt,
              text:
                status === "Diproses"
                  ? "Petugas meninjau lokasi dan menjadwalkan pemeriksaan."
                  : status === "Selesai"
                    ? "Penanganan telah selesai dan hasil tersedia."
                    : "Lokasi berada di luar wilayah layanan kelurahan.",
            },
          ]
        : []),
    ],
    photo: "illustration",
    photoName: "foto-lampu.jpg",
    result:
      status === "Selesai"
        ? "Pemeriksaan telah dilakukan. Area dibersihkan dan kondisi kembali dapat digunakan oleh warga."
        : undefined,
    resolvedAt: status === "Selesai" ? assignedAt : undefined,
    rejection:
      status === "Ditolak"
        ? "Lokasi berada di luar wilayah layanan kelurahan. Mohon gunakan kanal resmi wilayah terkait."
        : undefined,
    rejectionCode: status === "Ditolak" ? "outside_area" : undefined,
  };
}
initialState.reports = [
  report("124", "Lampu jalan tidak menyala", "Diproses", "c1", "10-06", "p1"),
  report("126", "Saluran air tersumbat", "Diterima", "c1", "10-07"),
  report("103", "Sampah menumpuk di area umum", "Selesai", "c2", "10-01", "p1"),
  report(
    "121",
    "Jalan lingkungan berlubang",
    "Diproses",
    "c1",
    "10-05",
    "p2",
    "w2",
  ),
  report(
    "128",
    "Gangguan ketertiban malam hari",
    "Diterima",
    "c3",
    "10-08",
    undefined,
    "w2",
  ),
  report(
    "129",
    "Informasi pelayanan belum jelas",
    "Diterima",
    "c4",
    "10-09",
    undefined,
    "w3",
  ),
  report(
    "98",
    "Perbaikan jalan di luar wilayah",
    "Ditolak",
    "c1",
    "09-29",
    undefined,
    "w2",
  ),
  report(
    "92",
    "Sampah pada saluran lingkungan",
    "Selesai",
    "c2",
    "09-20",
    "p2",
    "w2",
  ),
  report("91", "Penerangan jalan redup", "Selesai", "c1", "09-18", "p1", "w3"),
  report(
    "83",
    "Ketertiban parkir lingkungan",
    "Selesai",
    "c3",
    "08-17",
    "p1",
    "w2",
  ),
  report(
    "70",
    "Penjelasan antrean layanan",
    "Selesai",
    "c4",
    "07-12",
    "p2",
    "w3",
  ),
  report(
    "52",
    "Drainase lingkungan tersumbat",
    "Selesai",
    "c1",
    "06-21",
    "p1",
    "w2",
  ),
];
export function seed(): DemoState {
  return structuredClone(initialState);
}
