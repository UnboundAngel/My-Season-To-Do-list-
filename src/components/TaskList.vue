<template>
  <div class="listWrap">
    <div class="toolbar" role="region" aria-label="Task filters">
      <div class="tabs" role="tablist" aria-label="Task filters">
        <button
          v-for="option in filters"
          :key="option"
          type="button"
          class="tab"
          :class="{ active: filter === option }"
          role="tab"
          :aria-selected="filter === option"
          @click="setFilter(option)"
        >
          {{ label(option) }}
        </button>
      </div>
      <div class="searchGroup">
        <input
          id="search"
          class="search"
          :value="query"
          @input="onQuery"
          type="search"
          placeholder="Search ( / )"
          aria-label="Search tasks"
        />
        <label class="sortLabel">
          <span class="sr-only">Sort by due date</span>
          <select :value="sort" @change="onSort" aria-label="Sort by due date">
            <option value="asc">Due ↑</option>
            <option value="desc">Due ↓</option>
          </select>
        </label>
      </div>
    </div>

    <div class="list" role="list" aria-live="polite">
      <p v-if="visible.length === 0" class="empty">No tasks yet. Add one or seed demo data.</p>
      <TaskRow
        v-for="task in visible"
        :key="task.id"
        :task="task"
        @open-card="$emit('open-card', task.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import TaskRow from './TaskRow.vue';
import { useTasks, TaskFilter, SortOrder } from '../stores/tasks';

const emit = defineEmits<{ (e: 'open-card', id: string): void }>();
const store = useTasks();
const { filter, visible, sort } = storeToRefs(store);
const query = computed(() => store.query);

const filters: TaskFilter[] = ['all', 'pending', 'done', 'today', 'upcoming'];
const label = (value: TaskFilter) => value.charAt(0).toUpperCase() + value.slice(1);

function setFilter(next: TaskFilter) {
  store.setFilter(next);
}
function onQuery(event: Event) {
  const target = event.target as HTMLInputElement;
  store.setQuery(target.value);
}
function onSort(event: Event) {
  const target = event.target as HTMLSelectElement;
  store.setSort(target.value as SortOrder);
}
</script>
