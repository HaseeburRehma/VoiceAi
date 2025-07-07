<template>
  <div class="max-w-md mx-auto p-6 space-y-6 bg-white rounded-lg shadow">
    <h1 class="text-2xl font-bold text-center">📞 In-App Dialer</h1>

    <!-- Status & Timer -->
    <div class="flex items-center justify-between">
      <span 
        class="px-3 py-1 rounded-full text-sm font-medium"
        :class="isCalling ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
      >
        {{ isCalling ? 'In Call' : 'Idle' }}
      </span>
      <span v-if="isCalling" class="text-sm font-mono">{{ formattedDuration }}</span>
    </div>

    <!-- Number Input + Buttons -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <i class="i-lucide-phone absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400"></i>
        <input
          v-model="toNumber"
          @keyup.enter="startCall"
          :disabled="isCalling"
          type="tel"
          placeholder="+1 (555) 123-4567"
          class="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring"
        />
      </div>
      <button
        @click="startCall"
        :disabled="!device || isCalling"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isCalling ? 'Calling…' : 'Call' }}
      </button>
      <button
        v-if="isCalling"
        @click="hangUp"
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Hang Up
      </button>
    </div>

    <!-- Call Log -->
    <ul class="space-y-2 max-h-40 overflow-y-auto">
      <li
        v-for="(entry,i) in callLog"
        :key="i"
        class="flex justify-between text-sm"
      >
        <span>{{ entry.time }}</span>
        <span>{{ entry.message }}</span>
      </li>
      <li v-if="!callLog.length" class="text-center text-gray-400 text-sm">
        No activity yet.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Device } from '@twilio/voice-sdk'

/** reactive state **/
const toNumber    = ref('')
const isCalling   = ref(false)
const device      = ref<Device|null>(null)
const callLog     = ref<{ time: string; message: string }[]>([])

/** timer for call duration **/
const callSeconds = ref(0)
let timerHandle: number|null = null

watch(isCalling, (on) => {
  if (on) {
    callSeconds.value = 0
    timerHandle = window.setInterval(() => callSeconds.value++, 1000)
  } else {
    if (timerHandle) clearInterval(timerHandle)
  }
})

const formattedDuration = computed(() => {
  const m = Math.floor(callSeconds.value / 60)
  const s = callSeconds.value % 60
  return `${m}:${s.toString().padStart(2,'0')}`
})

/** utilities **/
function log(msg: string) {
  const now = new Date().toLocaleTimeString()
  callLog.value.unshift({ time: now, message: msg })
}

/** fetch a fresh Twilio token **/
async function fetchToken() {
  const { token } = await fetch('/api/twilio-token').then(r => r.json())
  return token as string
}

/** init device on mount **/
onMounted(async () => {
  const token = await fetchToken()
  device.value = new Device(token, {
    codecPreferences: [
      Device.Codec.OPUS,
      Device.Codec.PCMU
    ]
  })

  device.value.on('ready',     () => log('Device ready'))
  device.value.on('error',     e  => log(`Error: ${e.message}`))
  device.value.on('connect',   () => {
    isCalling.value = true
    log('Call connected')
  })
  device.value.on('disconnect',() => {
    isCalling.value = false
    log('Call ended')
  })
})

/** start a call **/
function startCall() {
  if (!device.value || !toNumber.value.trim()) return
  log(`Calling ${toNumber.value}…`)
  device.value.connect({
    params: { To: toNumber.value.trim() }
  })
}

/** hang up **/
function hangUp() {
  device.value?.disconnectAll()
}
</script>

<style scoped>
/* you can fine-tune your focus rings or colors here */
</style>
