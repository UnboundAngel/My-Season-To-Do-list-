<template>
  <form class="form" @submit.prevent="submit" @keydown="handleKey">
    <label for="task-name">Task name</label>
    <input
      id="task-name"
      ref="nameInput"
      v-model="name"
      required
      placeholder="e.g. Finish systems homework"
      autocomplete="off"
    />

    <label for="task-desc">Description</label>
    <textarea
      id="task-desc"
      v-model="desc"
      placeholder="Optional notes…"
      rows="3"
    />

    <div class="row">
      <label for="task-priority">Priority</label>
      <select id="task-priority" v-model="priority">
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <label for="task-category">Category</label>
      <input id="task-category" v-model="category" placeholder="e.g. school" />

      <label for="task-due">Due</label>
      <input id="task-due" type="datetime-local" v-model="due" />
    </div>

    <div class="row actions">
      <button class="btn primary" type="submit">{{ editing ? 'Update task' : 'Save task' }}</button>
      <button class="btn" type="button" @click="clear">Clear</button>
      <button class="btn" type="button" @click="clearCompleted">Clear completed</button>
      <button class="btn" type="button" @click="seedDemo">Seed demo</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTasks } from '../stores/tasks';

const store = useTasks();
const name = ref('');
const desc = ref('');
const priority = ref<'High' | 'Medium' | 'Low'>('Medium');
const category = ref('');
const due = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

const editingTask = computed(() => store.editingTask);
const editing = computed(() => Boolean(editingTask.value));

const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const defaultDue = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

function resetForm() {
  name.value = '';
  desc.value = '';
  priority.value = 'Medium';
  category.value = '';
  due.value = defaultDue();
  store.clearEditing();
}

watch(editingTask, (task) => {
  if (!task) {
    resetForm();
    return;
  }
  name.value = task.name;
  desc.value = task.desc;
  priority.value = task.priority;
  category.value = task.category;
  due.value = toLocalInput(task.due);
  nextTick(() => nameInput.value?.focus());
});

function submit() {
  if (!name.value.trim()) return;
  const payload = {
    name: name.value.trim(),
    desc: desc.value.trim(),
    priority: priority.value,
    category: category.value.trim(),
    due: due.value
  };
  if (editingTask.value) {
    store.update(editingTask.value.id, payload);
  } else {
    store.add(payload);
  }
  resetForm();
}

function clear() {
  resetForm();
  nextTick(() => nameInput.value?.focus());
}

function clearCompleted() {
  store.clearDone();
}

function seedDemo() {
  store.seed();
}

function handleKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    submit();
  }
}

onMounted(() => {
  due.value = defaultDue();
});
</script>
