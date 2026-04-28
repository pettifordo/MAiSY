import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Deal,
  Stage,
  TeamMember,
  Activity,
  Document,
  Task,
  DiligenceItem,
  Contact,
  DiligenceCategory,
} from '../types';
import {
  SEED_DEALS,
  DEFAULT_STAGES,
  SEED_TEAM,
  SEED_ACTIVITIES,
  SEED_DOCUMENTS,
  SEED_TASKS,
  SEED_DILIGENCE,
  SEED_CONTACTS,
  DILIGENCE_TEMPLATES,
} from '../data/seed';

interface AppState {
  // Data
  deals: Deal[];
  stages: Stage[];
  team: TeamMember[];
  activities: Activity[];
  documents: Document[];
  tasks: Task[];
  diligenceItems: DiligenceItem[];
  contacts: Contact[];
  currentUserId: string;
  seeded: boolean;

  // Deal actions
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'stageHistory'>) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  moveDeal: (dealId: string, newStageId: string) => void;
  deleteDeal: (id: string) => void;

  // Stage actions
  addStage: (stage: Omit<Stage, 'id'>) => void;
  updateStage: (id: string, updates: Partial<Stage>) => void;
  deleteStage: (id: string) => void;
  reorderStages: (stages: Stage[]) => void;

  // Activity actions
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;

  // Document actions
  addDocument: (doc: Omit<Document, 'id'>) => void;
  deleteDocument: (id: string) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Diligence actions
  applyDiligenceTemplate: (dealId: string, category: DiligenceCategory) => void;
  toggleDiligenceItem: (id: string) => void;
  deleteDiligenceItem: (id: string) => void;

  // Contact actions
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  // Settings
  setCurrentUser: (userId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      deals: SEED_DEALS,
      stages: DEFAULT_STAGES,
      team: SEED_TEAM,
      activities: SEED_ACTIVITIES,
      documents: SEED_DOCUMENTS,
      tasks: SEED_TASKS,
      diligenceItems: SEED_DILIGENCE,
      contacts: SEED_CONTACTS,
      currentUserId: 'u1',
      seeded: true,

      addDeal: (deal) => {
        const id = `d${uid()}`;
        const ts = now();
        set((s) => ({
          deals: [
            ...s.deals,
            {
              ...deal,
              id,
              createdAt: ts,
              updatedAt: ts,
              stageHistory: [{ stageId: deal.stageId, enteredAt: ts }],
            },
          ],
        }));
      },

      updateDeal: (id, updates) => {
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: now() } : d
          ),
        }));
      },

      moveDeal: (dealId, newStageId) => {
        const ts = now();
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === dealId
              ? {
                  ...d,
                  stageId: newStageId,
                  updatedAt: ts,
                  stageHistory: [
                    ...d.stageHistory,
                    { stageId: newStageId, enteredAt: ts },
                  ],
                }
              : d
          ),
          activities: [
            ...s.activities,
            {
              id: `a${uid()}`,
              dealId,
              type: 'update',
              title: 'Stage updated',
              body: `Deal moved to ${s.stages.find(st => st.id === newStageId)?.name ?? newStageId}`,
              authorId: s.currentUserId,
              createdAt: ts,
            },
          ],
        }));
      },

      deleteDeal: (id) => {
        set((s) => ({
          deals: s.deals.filter((d) => d.id !== id),
          activities: s.activities.filter((a) => a.dealId !== id),
          documents: s.documents.filter((doc) => doc.dealId !== id),
          tasks: s.tasks.filter((t) => t.dealId !== id),
          diligenceItems: s.diligenceItems.filter((di) => di.dealId !== id),
          contacts: s.contacts.filter((c) => c.dealId !== id),
        }));
      },

      addStage: (stage) => {
        set((s) => ({
          stages: [...s.stages, { ...stage, id: `stage_${uid()}` }],
        }));
      },

      updateStage: (id, updates) => {
        set((s) => ({
          stages: s.stages.map((st) => (st.id === id ? { ...st, ...updates } : st)),
        }));
      },

      deleteStage: (id) => {
        set((s) => ({
          stages: s.stages.filter((st) => st.id !== id),
        }));
      },

      reorderStages: (stages) => set({ stages }),

      addActivity: (activity) => {
        set((s) => ({
          activities: [
            ...s.activities,
            { ...activity, id: `a${uid()}`, createdAt: now() },
          ],
        }));
      },

      addDocument: (doc) => {
        set((s) => ({
          documents: [...s.documents, { ...doc, id: `doc${uid()}` }],
        }));
      },

      deleteDocument: (id) => {
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
      },

      addTask: (task) => {
        set((s) => ({
          tasks: [
            ...s.tasks,
            { ...task, id: `t${uid()}`, createdAt: now() },
          ],
        }));
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      applyDiligenceTemplate: (dealId, category) => {
        const existing = get().diligenceItems.filter(
          (di) => di.dealId === dealId && di.category === category
        );
        if (existing.length > 0) return; // already applied
        const template = DILIGENCE_TEMPLATES[category] ?? [];
        const newItems: DiligenceItem[] = template.map((item) => ({
          id: `di${uid()}`,
          dealId,
          category,
          label: item.label,
          checked: false,
        }));
        set((s) => ({ diligenceItems: [...s.diligenceItems, ...newItems] }));
      },

      toggleDiligenceItem: (id) => {
        set((s) => ({
          diligenceItems: s.diligenceItems.map((di) =>
            di.id === id ? { ...di, checked: !di.checked } : di
          ),
        }));
      },

      deleteDiligenceItem: (id) => {
        set((s) => ({
          diligenceItems: s.diligenceItems.filter((di) => di.id !== id),
        }));
      },

      addContact: (contact) => {
        set((s) => ({
          contacts: [...s.contacts, { ...contact, id: `c${uid()}` }],
        }));
      },

      updateContact: (id, updates) => {
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteContact: (id) => {
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
      },

      setCurrentUser: (userId) => set({ currentUserId: userId }),
    }),
    {
      name: 'maisy-store',
    }
  )
);
