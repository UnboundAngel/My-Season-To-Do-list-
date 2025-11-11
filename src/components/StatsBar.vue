<template>
  <section class="stats" aria-label="Task stats">
    <article class="card" aria-live="polite">
      <div class="k">Total</div>
      <div class="v">{{ stats.total }}</div>
    </article>
    <article class="card" aria-live="polite">
      <div class="k">Today</div>
      <div class="v">{{ stats.today }}</div>
    </article>
    <article class="card" aria-live="polite">
      <div class="k">Done</div>
      <div class="v">{{ stats.done }}</div>
    </article>
    <article class="card focus" aria-live="polite">
      <div class="k">Focus</div>
      <div class="v">{{ stats.prod }}%</div>
      <div class="meter" role="presentation"><i :style="{ width: stats.prod + '%' }" /></div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useTasks } from '../stores/tasks';

const store = useTasks();
const { stats } = storeToRefs(store);
</script>
