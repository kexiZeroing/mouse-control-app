<template>
  <div class="container">
    <h1>Mouse Control</h1>
    <p>Connect to: {{ serverAddress }}</p>
    
    <div class="controls">
      <div
        class="control-pad" 
        @touchstart="startMove" 
        @touchmove="handleMove" 
        @touchend="stopMove"
        @click="handleClick"
      >
        <div class="cursor" :style="cursorStyle"></div>
      </div>

      <div class="keyboard-input">
        <input 
          v-model="inputText" 
          placeholder="Type here..."
        >
        <button @click="sendText(false)">Send</button>
        <button @click="sendText(true)">Send + Enter</button>
      </div>
    </div>
    
    <p>Status: {{ status }}</p>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      cursorX: 150, // Center of pad
      cursorY: 200, // Center of pad
      status: 'Disconnected',
      isMoving: false,
      lastTouch: null,
      serverAddress: 'Loading...',
      // the ratio between the physical movement of your finger on the touchpad 
      // and the resulting movement of the mouse cursor on the PC screen.
      sensitivity: 3,
      inputText: ''
    }
  },
  computed: {
    cursorStyle() {
      return {
        left: `${this.cursorX}px`,
        top: `${this.cursorY}px`
      }
    }
  },
  mounted() {
    this.socket = io(); // Get server IP dynamically
    
    this.socket.on('connect', () => {
      this.status = 'Connected';
    });
    
    this.socket.on('serverInfo', (info) => {
      this.serverAddress = `http://${info.ip}:${info.port}`;
    });
    
    this.socket.on('disconnect', () => {
      this.status = 'Disconnected';
    });
  },
  methods: {
    startMove(event) {
      this.isMoving = true;
      this.lastTouch = event.touches[0];
    },
    handleMove(event) {
      if (!this.isMoving || !this.lastTouch) return;
      
      const touch = event.touches[0];
      const rect = event.target.getBoundingClientRect();
      
      // Calculate movement delta
      const dx = (touch.clientX - this.lastTouch.clientX) * this.sensitivity;
      const dy = (touch.clientY - this.lastTouch.clientY) * this.sensitivity;

      // Update cursor position for visual feedback (keep within bounds)
      this.cursorX = Math.max(0, Math.min(300, this.cursorX + dx));
      this.cursorY = Math.max(0, Math.min(400, this.cursorY + dy));

      this.socket.emit('moveMouse', { dx, dy });
      
      this.lastTouch = touch;
    },
    stopMove() {
      this.isMoving = false;
      this.lastTouch = null;
    },
    handleClick() {
      this.socket.emit('mouseClick');
    },
    sendText(sendEnter) {
      this.socket.emit('typeText', { 
        text: this.inputText,
        sendEnter: sendEnter
      });
    }
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
</script>

<style>
.container {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-pad {
  width: 300px;
  height: 400px;
  background: #f0f0f0;
  position: relative;
  border: 2px solid #333;
  touch-action: none;
}

.cursor {
  width: 10px;
  height: 10px;
  background: red;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
}

.keyboard-input {
  display: flex;
  gap: 10px;
}

.keyboard-input input {
  flex: 1;
  padding: 5px;
}
</style>