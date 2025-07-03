<template>
  <div class="space-y-1 p-4 bg-gray-800 rounded-lg h-64 overflow-auto">
    <div
      v-for="(line, i) in lines"
      :key="i"
      class="flex items-start gap-2"
    >
      <UIcon name="i-lucide-mic" class="text-green-400" />
      <p class="text-sm text-gray-200 flex-1">{{ line }}</p>
      <UIcon name="i-lucide-user" class="text-blue-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ transcript: string }>()
const lines = computed(() => props.transcript.split(/\r?\n/).filter(l => l))
</script>
