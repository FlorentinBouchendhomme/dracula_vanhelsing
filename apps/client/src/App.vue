<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ServerToClient } from "@game/shared";

const status = ref("disconnected");
const lastMessage = ref<string>("");

onMounted(() => {
  const ws = new WebSocket("ws://localhost:8787");

  // Expose for manual testing in browser console
  (window as unknown as { __ws?: WebSocket }).__ws = ws;

  status.value = "connecting";

  ws.onopen = () => {
    status.value = "connected";
    ws.send(
      JSON.stringify({
        type: "PING",
        id: globalThis.crypto.randomUUID(),
        ts: Date.now(),
        payload: { t: Date.now() }
      })
    );
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(String(event.data)) as ServerToClient;
    lastMessage.value = JSON.stringify(msg, null, 2);
  };

  ws.onclose = () => {
    status.value = "disconnected";
  };

  ws.onerror = () => {
    status.value = "error";
  };
});
</script>

<template>
  <main style="font-family: system-ui; padding: 16px">
    <h1>Dracula vs Van Helsing</h1>
    <p>Status => {{ status }}</p>
    <pre style="background: #111; color: #eee; padding: 12px; border-radius: 8px; overflow: auto"
      >{{ lastMessage }}
    </pre>
  </main>
</template>
