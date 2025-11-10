<template>
  <div class="themeRow" role="group" aria-label="Theme selector">
    <label class="sr-only" for="theme-select">Theme</label>
    <select id="theme-select" v-model="theme" @change="apply">
      <option value="pro">Professional</option>
      <option value="spring">Spring</option>
      <option value="summer">Summer</option>
      <option value="autumn">Autumn</option>
      <option value="winter">Winter</option>
    </select>
    <label class="toggle">
      <input type="checkbox" v-model="halloween" @change="apply" />
      <span>Halloween</span>
    </label>
    <label class="toggle">
      <input type="checkbox" v-model="christmas" @change="apply" />
      <span>Christmas</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

type ThemeKey = 'pro' | 'spring' | 'summer' | 'autumn' | 'winter';

const theme = ref<ThemeKey>('pro');
const halloween = ref(false);
const christmas = ref(false);

function apply() {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.value);
  root.classList.toggle('holiday-halloween', halloween.value);
  root.classList.toggle('holiday-christmas', christmas.value);
  const payload = { theme: theme.value, halloween: halloween.value, christmas: christmas.value };
  window.localStorage.setItem('bst.theme', JSON.stringify(payload));
}

onMounted(() => {
  try {
    const saved = JSON.parse(window.localStorage.getItem('bst.theme') || '{}');
    if (saved.theme) theme.value = saved.theme;
    halloween.value = Boolean(saved.halloween);
    christmas.value = Boolean(saved.christmas);
  } catch (error) {
    console.warn('Failed to load theme preference', error);
  }
  apply();
});
</script>
