import { defineStore } from 'pinia';
import { computed } from 'vue';
import { createLocalStorageAdapter } from '../utils/storage';

export type Priority = 'High' | 'Medium' | 'Low';
export type TaskFilter = 'all' | 'pending' | 'done' | 'today' | 'upcoming';
export type SortOrder = 'asc' | 'desc';

export interface Task {
  id: string;
  name: string;
  desc: string;
  priority: Priority;
  category: string;
  due?: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

interface State {
  tasks: Task[];
  filter: TaskFilter;
  query: string;
  sort: SortOrder;
  editingId: string | null;
}

const storage = createLocalStorageAdapter<Task[]>(
  'bst.tasks.v1',
  []
);

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

function normalizeDue(value?: string | null): string | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString();
}

export const useTasks = defineStore('tasks', {
  state: (): State => ({
    tasks: storage.load(),
    filter: 'all',
    query: '',
    sort: 'asc',
    editingId: null
  }),
  getters: {
    visible(state): Task[] {
      const now = new Date();
      const q = state.query.trim().toLowerCase();
      const filtered = state.tasks.filter((task) => {
        switch (state.filter) {
          case 'done':
            return task.done;
          case 'pending':
            return !task.done;
          case 'today':
            if (!task.due) return false;
            return new Date(task.due).toDateString() === now.toDateString();
          case 'upcoming':
            if (!task.due) return false;
            return new Date(task.due).getTime() > now.getTime();
          default:
            return true;
        }
      }).filter((task) => {
        if (!q) return true;
        const haystack = `${task.name} ${task.desc} ${task.category}`.toLowerCase();
        return haystack.includes(q);
      });

      const direction = state.sort === 'asc' ? 1 : -1;
      return filtered.slice().sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const ad = a.due ? new Date(a.due).getTime() : Number.POSITIVE_INFINITY;
        const bd = b.due ? new Date(b.due).getTime() : Number.POSITIVE_INFINITY;
        if (ad === bd) return a.createdAt - b.createdAt;
        return (ad - bd) * direction;
      });
    },
    editingTask(state): Task | undefined {
      if (!state.editingId) return undefined;
      return state.tasks.find((task) => task.id === state.editingId);
    },
    stats(state) {
      const total = state.tasks.length;
      const done = state.tasks.filter((task) => task.done).length;
      const today = state.tasks.filter((task) => {
        if (!task.due) return false;
        return new Date(task.due).toDateString() === new Date().toDateString();
      }).length;
      const prod = total ? Math.round((done / total) * 100) : 0;
      return { total, done, today, prod };
    }
  },
  actions: {
    persist() {
      storage.save(this.tasks);
    },
    clearEditing() {
      this.editingId = null;
    },
    beginEdit(id: string) {
      this.editingId = id;
    },
    setFilter(filter: TaskFilter) {
      this.filter = filter;
    },
    setSort(order: SortOrder) {
      this.sort = order;
    },
    setQuery(query: string) {
      this.query = query;
    },
    add(payload: {
      name: string;
      desc?: string;
      priority: Priority;
      category?: string;
      due?: string;
    }) {
      const now = Date.now();
      this.tasks.push({
        id: createId(),
        name: payload.name,
        desc: payload.desc ?? '',
        priority: payload.priority,
        category: payload.category ?? '',
        due: normalizeDue(payload.due),
        done: false,
        createdAt: now,
        updatedAt: now
      });
      this.persist();
    },
    update(id: string, payload: {
      name: string;
      desc?: string;
      priority: Priority;
      category?: string;
      due?: string;
      done?: boolean;
    }) {
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return;
      task.name = payload.name;
      task.desc = payload.desc ?? '';
      task.priority = payload.priority;
      task.category = payload.category ?? '';
      task.due = normalizeDue(payload.due);
      if (typeof payload.done === 'boolean') {
        task.done = payload.done;
        task.completedAt = payload.done ? Date.now() : undefined;
      }
      task.updatedAt = Date.now();
      this.persist();
    },
    toggle(id: string) {
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return;
      task.done = !task.done;
      task.completedAt = task.done ? Date.now() : undefined;
      task.updatedAt = Date.now();
      this.persist();
    },
    remove(id: string) {
      this.tasks = this.tasks.filter((task) => task.id !== id);
      if (this.editingId === id) this.editingId = null;
      this.persist();
    },
    clearDone() {
      this.tasks = this.tasks.filter((task) => !task.done);
      if (this.editingId && !this.tasks.some((task) => task.id === this.editingId)) {
        this.editingId = null;
      }
      this.persist();
    },
    seed() {
      if (this.tasks.length) return;
      const now = new Date();
      const iso = (offsetHours: number) => {
        const t = new Date(now.getTime() + offsetHours * 3600 * 1000);
        return t.toISOString();
      };
      this.tasks = [
        {
          id: createId(),
          name: 'Study algorithms',
          desc: '30 minutes of graph problems.',
          priority: 'High',
          category: 'school',
          due: iso(4),
          done: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: createId(),
          name: 'Gym push day',
          desc: 'Bench + overhead press.',
          priority: 'Medium',
          category: 'health',
          due: iso(8),
          done: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: createId(),
          name: 'Ship card flip',
          desc: 'Polish the deck animation.',
          priority: 'Low',
          category: 'dev',
          due: iso(24),
          done: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];
      this.editingId = null;
      this.persist();
    }
  }
});

export const useVisibleTasks = () => {
  const store = useTasks();
  return computed(() => store.visible);
};
