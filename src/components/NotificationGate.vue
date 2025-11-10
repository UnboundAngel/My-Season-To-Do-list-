<template>
  <div v-if="supported" class="notify">
    <button type="button" class="btn" :disabled="permission === 'granted'" @click="enable">
      {{ label }}
    </button>
    <span class="hint" role="status">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDueNotifications } from '../composables/useDueNotifications';

const { supported, permission, requestPermission } = useDueNotifications();

const statusText = computed(() => {
  if (permission.value === 'granted') return 'Notifications active (due soon / due now).';
  if (permission.value === 'denied') return 'Notifications blocked in browser settings.';
  return 'Enable reminders for tasks due within 5 minutes or now.';
});

const label = computed(() => (permission.value === 'granted' ? 'Notifications on' : 'Enable reminders'));

async function enable() {
  await requestPermission();
}
</script>
