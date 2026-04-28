export type StageId = string;

export type DealStage =
  | 'prospect'
  | 'nda'
  | 'diligence'
  | 'loi'
  | 'closing'
  | 'won'
  | 'dead';

export type Sector =
  | 'Specialty Chemicals'
  | 'Industrial Coatings'
  | 'Adhesives & Sealants'
  | 'Polymer Processing'
  | 'Performance Materials'
  | 'Agrochemicals'
  | 'Fine Chemicals';

export type DealSize = 'small' | 'mid' | 'large';

export interface Stage {
  id: StageId;
  name: string;
  probability: number; // 0-100
  color: string;
  order: number;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: 'Admin' | 'Deal Lead' | 'Analyst';
  email: string;
  avatarColor: string;
}

export interface Contact {
  id: string;
  dealId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface Activity {
  id: string;
  dealId: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'update';
  title: string;
  body: string;
  authorId: string;
  createdAt: string; // ISO
}

export interface Document {
  id: string;
  dealId: string;
  filename: string;
  type: 'NDA' | 'CIM' | 'LOI' | 'Model' | 'Report' | 'Other';
  uploadedAt: string; // ISO
  version: string;
  uploadedBy: string;
  sizeKb: number;
}

export type TaskStatus = 'open' | 'in-progress' | 'done';

export interface Task {
  id: string;
  dealId: string;
  title: string;
  ownerId: string;
  dueDate: string; // ISO date
  status: TaskStatus;
  createdAt: string;
}

export type DiligenceCategory = 'Legal' | 'Financial' | 'Commercial' | 'Operational';

export interface DiligenceItem {
  id: string;
  dealId: string;
  category: DiligenceCategory;
  label: string;
  checked: boolean;
}

export interface Financials {
  revenue: number; // £m
  ebitda: number; // £m
  ev: number; // £m
  ebitdaMargin: number; // %
  revenueGrowth: number; // % YoY
  netDebt: number; // £m
  year: number;
}

export interface Deal {
  id: string;
  name: string;
  description: string;
  sector: Sector;
  geography: string;
  stageId: StageId;
  financials: Financials;
  ownerIds: string[]; // TeamMember ids
  advisors: string;
  ownership: string; // e.g. "PE-backed", "Family-owned"
  source: string; // origination source
  nextAction: string;
  nextActionDate: string; // ISO date
  createdAt: string; // ISO
  updatedAt: string; // ISO
  stageHistory: { stageId: StageId; enteredAt: string }[];
}
