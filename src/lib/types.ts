export type Role = "warga" | "pegawai" | "admin";
export type Status = "Diterima" | "Diproses" | "Selesai" | "Ditolak";
export const statuses: Status[] = [
  "Diterima",
  "Diproses",
  "Selesai",
  "Ditolak",
];
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  state: "active" | "inactive" | "pending";
}
export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
}
export interface Response {
  id: string;
  authorId: string;
  author: string;
  text: string;
  internal: boolean;
  kind: "perkembangan" | "internal" | "verifikasi" | "hasil" | "penolakan";
  at: string;
}
export interface Assignment {
  employeeId: string;
  employeeName: string;
  assignedBy: string;
  at: string;
  endedAt?: string;
  reason: string;
}
export interface StatusEvent {
  status: Status;
  at: string;
  text: string;
}
export interface Report {
  id: string;
  number: string;
  userId: string;
  title: string;
  description: string;
  location: string;
  categoryId: string;
  status: Status;
  createdAt: string;
  resolvedAt?: string;
  version: number;
  employeeId?: string;
  lastEmployeeId?: string;
  assignments: Assignment[];
  responses: Response[];
  history: StatusEvent[];
  photo?: string;
  photoName?: string;
  resultPhoto?: string;
  result?: string;
  rejectionCode?: string;
  rejection?: string;
}
export interface Audit {
  id: string;
  at: string;
  actor: string;
  action: string;
  object: string;
  reason: string;
}
export interface DemoState {
  schema: 1;
  users: User[];
  categories: Category[];
  reports: Report[];
  audits: Audit[];
}
export interface Draft {
  title: string;
  categoryId: string;
  description: string;
  location: string;
  photo?: string;
  photoName?: string;
}
export interface MutationResult {
  ok: boolean;
  error?: string;
  reportId?: string;
  userId?: string;
  url?: string;
  user?: User;
}
export type Command =
  | { type: "submit"; actorId: string; draft: Draft; requestId: string }
  | {
      type: "verify";
      actorId: string;
      id: string;
      version: number;
      employeeId: string;
      text: string;
    }
  | {
      type: "reject";
      actorId: string;
      id: string;
      version: number;
      code: string;
      text: string;
    }
  | {
      type: "reassign";
      actorId: string;
      id: string;
      version: number;
      employeeId: string;
      text: string;
    }
  | {
      type: "respond";
      actorId: string;
      id: string;
      version: number;
      text: string;
      internal: boolean;
    }
  | {
      type: "complete";
      actorId: string;
      id: string;
      version: number;
      text: string;
      photo?: string;
    }
  | {
      type: "employee";
      actorId: string;
      id?: string;
      name: string;
      email: string;
      active?: boolean;
      state?: User["state"];
    }
  | {
      type: "category";
      actorId: string;
      id?: string;
      name: string;
      description: string;
      active: boolean;
    }
  | { type: "profile"; actorId: string; name: string; phone: string }
  | { type: "recover"; actorId: string; userId: string; reason: string };
