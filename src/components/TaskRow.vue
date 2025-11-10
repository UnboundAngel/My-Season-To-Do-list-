<template>
  <article
    class="task"
    role="listitem"
    tabindex="0"
    @click="openCard"
    @keydown.enter.prevent="openCard"
    @keydown.space.prevent="toggle"
  >
    <header>
      <h3 class="tTitle">{{ task.name }} <span v-if="task.done" aria-label="Completed">✅</span></h3>
      <p class="tDesc">{{ task.desc || 'No notes yet.' }}</p>
    </header>
    <dl class="badges">
      <div><dt class="sr-only">Priority</dt><dd class="pill" :class="'pri-' + task.priority">{{ task.priority }}</dd></div>
      <div><dt class="sr-only">Category</dt><dd class="pill">{{ categoryLabel }}</dd></div>
      <div><dt class="sr-only">Due</dt><dd class="pill">{{ dueLabel }}</dd></div>
    </dl>
    <div class="actions" @click.stop>
      <button type="button" class="btn small good" @click="toggle">{{ task.done ? 'Mark pending' : 'Mark done' }}</button>
      <button type="button" class="btn small" @click="edit">Edit</button>
      <button type="button" class="btn small bad" @click="remove">Delete</button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTasks, Task } from '../stores/tasks';

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ (e: 'open-card', id: string): void }>();
const store = useTasks();

const categoryLabel = computed(() => (props.task.category ? `#${props.task.category}` : '#general'));
const dueLabel = computed(() => (props.task.due ? new Date(props.task.due).toLocaleString() : 'No due date'));

function openCard() {
  emit('open-card', props.task.id);
}
function toggle() {
  store.toggle(props.task.id);
}
function edit() {
  store.beginEdit(props.task.id);
  const input = document.getElementById('task-name') as HTMLInputElement | null;
  requestAnimationFrame(() => input?.focus());
}
function remove() {
  if (confirm('Delete this task?')) {
    store.remove(props.task.id);
  }
}
</script>
