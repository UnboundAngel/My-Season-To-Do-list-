<template>
  <main class="wrap" :class="{ reduce: prefersReducedMotion }">
    <header class="top">
      <h1>Blood &amp; Shadow Tasks</h1>
      <div class="controls">
        <NotificationGate />
        <ThemeToggle />
      </div>
      <StatsBar />
    </header>

    <section class="grid">
      <section class="panel" aria-labelledby="tasks-heading">
        <div class="panel-h"><h2 id="tasks-heading">Tasks</h2></div>
        <TaskList @open-card="openDeck" />
      </section>

      <section class="panel" aria-labelledby="editor-heading">
        <div class="panel-h"><h2 id="editor-heading">Create / Edit Task</h2></div>
        <TaskEditor />
      </section>

      <section class="panel" aria-labelledby="icon-heading">
        <div class="panel-h"><h2 id="icon-heading">App Icon</h2></div>
        <IconDownload />
      </section>
    </section>

    <CardDeck :open-id="deckId" :reduced-motion="prefersReducedMotion" @close="deckId = null" />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import TaskList from './components/TaskList.vue';
import TaskEditor from './components/TaskEditor.vue';
import StatsBar from './components/StatsBar.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import CardDeck from './components/CardDeck.vue';
import IconDownload from './components/IconDownload.vue';
import NotificationGate from './components/NotificationGate.vue';

const deckId = ref<string | null>(null);
const prefersReducedMotion = ref(false);
let motionQuery: MediaQueryList | null = null;
let motionListener: ((event: MediaQueryListEvent) => void) | null = null;

function openDeck(id: string) {
  deckId.value = id;
}

function handleGlobalKeys(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  const isTyping = target?.closest('input, textarea, [contenteditable="true"]');
  if (event.key === '/' && !isTyping) {
    event.preventDefault();
    const el = document.getElementById('search');
    if (el instanceof HTMLInputElement) {
      el.focus();
      el.select();
    }
    return;
  }
  if ((event.key === 'n' || event.key === 'N') && !isTyping) {
    const input = document.getElementById('task-name');
    if (input instanceof HTMLInputElement) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  }
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionListener = () => {
    prefersReducedMotion.value = motionQuery?.matches ?? false;
  };
  motionListener();
  motionQuery.addEventListener('change', motionListener);
  document.addEventListener('keydown', handleGlobalKeys);
});

onBeforeUnmount(() => {
  if (motionQuery && motionListener) {
    motionQuery.removeEventListener('change', motionListener);
  }
  document.removeEventListener('keydown', handleGlobalKeys);
});
</script>
