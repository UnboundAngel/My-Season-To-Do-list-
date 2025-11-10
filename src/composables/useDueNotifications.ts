import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useTasks, Task } from '../stores/tasks';

const supported = typeof window !== 'undefined' && 'Notification' in window;
const permission = ref<NotificationPermission>(supported ? Notification.permission : 'denied');
let intervalId: number | null = null;
const triggered = new Map<string, { soon?: boolean; now?: boolean }>();

const formatNotificationBody = (task: Task, type: 'soon' | 'now') => {
  const due = task.due ? new Date(task.due).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No due date';
  return type === 'soon'
    ? `${task.name} is due at ${due}`
    : `${task.name} is due now`;
};

function maybeNotify(task: Task, type: 'soon' | 'now') {
  if (!supported || permission.value !== 'granted') return;
  const record = triggered.get(task.id) ?? {};
  if (record[type]) return;
  triggered.set(task.id, { ...record, [type]: true });
  new Notification(type === 'soon' ? 'Due soon' : 'Due now', {
    body: formatNotificationBody(task, type),
    tag: `${task.id}-${type}`,
    renotify: true,
    silent: false
  });
}

function evaluate(tasks: Task[]) {
  tasks.forEach((task) => {
    if (task.done) {
      triggered.delete(task.id);
    }
  });
  if (permission.value !== 'granted') return;
  const now = Date.now();
  const soonThreshold = 5 * 60 * 1000;
  tasks.forEach((task) => {
    if (!task.due || task.done) return;
    const dueTime = new Date(task.due).getTime();
    if (Number.isNaN(dueTime)) return;
    if (dueTime <= now) {
      maybeNotify(task, 'now');
    } else if (dueTime - now <= soonThreshold) {
      maybeNotify(task, 'soon');
    }
  });
}

export function useDueNotifications() {
  const store = useTasks();
  const { tasks } = storeToRefs(store);

  if (supported && intervalId === null) {
    intervalId = window.setInterval(() => evaluate(tasks.value), 30_000);
  }

  const canUse = computed(() => supported);

  const request = async () => {
    if (!supported) return 'denied' as NotificationPermission;
    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      if (result === 'granted') {
        evaluate(tasks.value);
      }
      return result;
    } catch (err) {
      console.warn('Notification permission request failed', err);
      permission.value = 'denied';
      return 'denied';
    }
  };

  watch(tasks, (list) => {
    evaluate(list);
  }, { deep: true, immediate: true });

  return {
    supported: canUse,
    permission: computed(() => permission.value),
    requestPermission: request
  };
}
