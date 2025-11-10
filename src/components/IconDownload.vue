<template>
  <div class="iconRow">
    <a class="btn primary" :href="iconHref" download="blood-shadow-icon.svg">Download SVG</a>
    <span class="hint">Vector icon. CSS variables tint seasonal accents.</span>
  </div>
  <div class="iconGrid">
    <figure v-for="item in icons" :key="item.name" class="iconTile">
      <img :src="item.href" :alt="item.name + ' icon'" />
      <figcaption>{{ item.name }}</figcaption>
    </figure>
  </div>
</template>

<script setup lang="ts">
interface IconItem {
  name: string;
  href: string;
}

const iconHref = new URL('../icons/favicon/icon.svg', import.meta.url).href;
const icons: IconItem[] = [
  { name: 'Default', href: iconHref },
  { name: 'Spring', href: new URL('../icons/seasons/spring.svg', import.meta.url).href },
  { name: 'Summer', href: new URL('../icons/seasons/summer.svg', import.meta.url).href },
  { name: 'Autumn', href: new URL('../icons/seasons/autumn.svg', import.meta.url).href },
  { name: 'Winter', href: new URL('../icons/seasons/winter.svg', import.meta.url).href },
  { name: 'Halloween', href: new URL('../icons/seasons/halloween.svg', import.meta.url).href },
  { name: 'Christmas', href: new URL('../icons/seasons/christmas.svg', import.meta.url).href }
];
</script>
