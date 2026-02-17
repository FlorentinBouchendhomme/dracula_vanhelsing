<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useGameStore } from "./state/game";
import NotificationsSystem from "./components/NotificationsSystem.vue";
import BoardView from "./components/board/BoardView.vue";

const game = useGameStore();

const roomName = ref("local");
const joinCode = ref("");

onMounted(() => {
  game.initWs();
});

const isInRoom = computed(() => Boolean(game.roomCode && game.playerId));
const canReady = computed(() => Boolean(game.room && game.playerId));

const mySlot = computed(() => {
  if (!game.room || !game.playerId) return null;
  return game.room.slots[game.playerId];
});
</script>

<template>
  <main style="font-family: system-ui; padding: 16px; max-width: 720px">
    <h1>Dracula vs Van Helsing</h1>
    <p>Status => {{ game.status }}</p>

    <section v-if="!isInRoom" style="display: grid; gap: 12px; margin-top: 16px">
      <div style="padding: 12px; border: 1px solid #ddd; border-radius: 8px">
        <h2 style="margin: 0 0 8px">Create room</h2>
        <div style="display: flex; gap: 8px">
          <input v-model="roomName" placeholder="room name" style="flex: 1; padding: 8px" />
          <button style="padding: 8px 12px" @click="game.createRoom(roomName)">Create</button>
        </div>
        <p v-if="game.roomCode" style="margin: 8px 0 0">
          Room code => <b>{{ game.roomCode }}</b>
        </p>
      </div>

      <div style="padding: 12px; border: 1px solid #ddd; border-radius: 8px">
        <h2 style="margin: 0 0 8px">Join room</h2>
        <div style="display: flex; gap: 8px">
          <input v-model="joinCode" placeholder="code" style="flex: 1; padding: 8px" />
          <button style="padding: 8px 12px" @click="game.joinRoom(joinCode.trim().toUpperCase())">
            Join
          </button>
        </div>
        <p style="margin: 8px 0 0; opacity: 0.7">Reconnect uses stored playerKey automatically.</p>
      </div>
    </section>

    <section v-else style="display: grid; gap: 12px; margin-top: 16px">
      <div style="padding: 12px; border: 1px solid #ddd; border-radius: 8px">
        <h2 style="margin: 0 0 8px">Room</h2>
        <p style="margin: 0">
          Code => <b>{{ game.roomCode }}</b>
        </p>
        <p style="margin: 0">
          You are => <b>{{ game.playerId }}</b>
        </p>
        <button style="margin-top: 8px; padding: 8px 12px" @click="game.leaveRoom()">Leave</button>
      </div>

      <div v-if="game.room" style="padding: 12px; border: 1px solid #ddd; border-radius: 8px">
        <h2 style="margin: 0 0 8px">Players</h2>

        <div style="display: grid; gap: 8px">
          <div>
            <b>P1</b>
            - connected => {{ game.room.slots.P1.isConnected }} - ready =>
            {{ game.room.slots.P1.isReady }}
          </div>
          <div>
            <b>P2</b>
            - connected => {{ game.room.slots.P2.isConnected }} - ready =>
            {{ game.room.slots.P2.isReady }}
          </div>
        </div>

        <div v-if="canReady" style="display: flex; gap: 8px; margin-top: 12px">
          <button
            v-if="mySlot && !mySlot.isReady"
            style="padding: 8px 12px"
            @click="game.setReady(true)"
          >
            Ready
          </button>
          <button
            v-if="mySlot && mySlot.isReady"
            style="padding: 8px 12px"
            @click="game.setReady(false)"
          >
            Unready
          </button>
        </div>
      </div>

      <div v-if="game.state" style="padding: 12px; border: 1px solid #ddd; border-radius: 8px">
        <h2 style="margin: 0 0 8px">State</h2>
        <BoardView
          v-if="game.room && game.state"
          :room="game.room"
          :state="game.state"
          :viewer-player-id="game.playerId"
        />

        <!-- Debug -->
        <pre
          style="background: #111; color: #eee; padding: 12px; border-radius: 8px; overflow: auto"
          >{{ JSON.stringify(game.state, null, 2) }}</pre
        >
      </div>
    </section>
    <NotificationsSystem />
  </main>
</template>
