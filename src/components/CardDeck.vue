<template>
  <div
    v-show="openId && current"
    class="deck"
    role="dialog"
    aria-modal="true"
    aria-label="Task card deck"
    @click.self="$emit('close')"
  >
    <div class="deckCard" :class="{ reduced: reducedMotion }" @click="flipNext">
      <div ref="inner" class="deckInner">
        <section class="cardFace">
          <header class="deckTitle">Task</header>
          <div class="deckBody" v-html="cardHTML(current)"></div>
          <footer class="deckFooter">
            <button
              type="button"
              class="btn small"
              :class="current?.done ? 'bad' : 'good'"
              @click.stop="toggle(current?.id)"
            >
              {{ current?.done ? 'Mark pending' : 'Mark done' }}
            </button>
            <span class="tDesc">{{ current?.done ? 'Completed' : 'Active' }}</span>
          </footer>
        </section>
        <section class="cardFace back">
          <header class="deckTitle">Next</header>
          <div class="deckBody" v-html="cardHTML(preview)"></div>
          <footer class="deckFooter"><span class="tDesc">Space/→ next • ← prev • Esc close</span></footer>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useTasks, Task } from '../stores/tasks';

const props = defineProps<{ openId: string | null; reducedMotion: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const store = useTasks();
const { visible: list } = storeToRefs(store);
const index = ref(0);
const inner = ref<HTMLDivElement | null>(null);
const animating = ref(false);
const direction = ref<'next' | 'prev'>('next');

const tasks = computed(() => list.value);
const current = computed<Task | undefined>(() => tasks.value[index.value]);
const preview = computed<Task | undefined>(() => {
  if (!tasks.value.length) return undefined;
  return tasks.value[(index.value + 1) % tasks.value.length];
});

watch(
  () => props.openId,
  (id) => {
    if (!id) return;
    const idx = tasks.value.findIndex((task) => task.id === id);
    index.value = idx >= 0 ? idx : 0;
  }
);

watch(tasks, (value) => {
  if (!value.length) {
    emit('close');
    return;
  }
  if (index.value >= value.length) {
    index.value = 0;
  }
});

function finishAnimation() {
  if (!animating.value) return;
  const len = tasks.value.length;
  if (!len) return;
  if (direction.value === 'next') {
    index.value = (index.value + 1) % len;
  } else {
    index.value = (index.value - 1 + len) % len;
  }
  animating.value = false;
  inner.value?.classList.remove('flip-next', 'flip-prev');
}

const handleTransition = (event: TransitionEvent) => {
  if (event.propertyName !== 'transform' || event.target !== inner.value) return;
  finishAnimation();
};

function flip(dir: 'next' | 'prev') {
  if (!props.openId) return;
  const len = tasks.value.length;
  if (len <= 1) return;
  if (props.reducedMotion) {
    direction.value = dir;
    if (dir === 'next') {
      index.value = (index.value + 1) % len;
    } else {
      index.value = (index.value - 1 + len) % len;
    }
    return;
  }
  if (animating.value) return;
  direction.value = dir;
  animating.value = true;
  requestAnimationFrame(() => {
    inner.value?.classList.remove('flip-next', 'flip-prev');
    void inner.value?.offsetWidth;
    inner.value?.classList.add(dir === 'next' ? 'flip-next' : 'flip-prev');
  });
}

function flipNext() {
  flip('next');
}
function flipPrev() {
  flip('prev');
}

function onKey(event: KeyboardEvent) {
  if (!props.openId) return;
  if (event.key === 'Escape') {
    emit('close');
    return;
  }
  if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'ArrowRight') {
    event.preventDefault();
    flipNext();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    flipPrev();
  }
}

function toggle(id?: string) {
  if (!id) return;
  store.toggle(id);
}

function cardHTML(task?: Task) {
  if (!task) return '<p class="tDesc">No task selected.</p>';
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!)
    );
  const due = task.due ? new Date(task.due).toLocaleString() : 'No due date';
  return `
    <div class="deckTask">
      <div class="deckHeading">${escape(task.name)} ${task.done ? '✅' : ''}</div>
      <p>${task.desc ? escape(task.desc) : 'No notes yet.'}</p>
      <div class="deckChips">
        <span class="pill pri-${task.priority}">${task.priority}</span>
        <span class="pill">${task.category ? '#' + escape(task.category) : '#general'}</span>
        <span class="pill">${escape(due)}</span>
      </div>
    </div>`;
}

onMounted(() => {
  document.addEventListener('keydown', onKey);
  const el = inner.value;
  if (el) {
    el.addEventListener('transitionend', handleTransition);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  const el = inner.value;
  if (el) {
    el.removeEventListener('transitionend', handleTransition);
  }
});
</script>
