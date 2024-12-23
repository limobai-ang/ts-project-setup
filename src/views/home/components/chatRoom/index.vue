<template>
  <div class="chat-room">
    <div class="message-list">
      <div v-for="(message, index) in messages" :key="index" class="message">
        <strong>{{ message.sender }}:</strong>
        <span>{{ message.content }}</span>
      </div>
    </div>

    <div class="input-container">
      <el-input v-model="newMessage" :rows="2" type="text" placeholder="Type a message" :disabled="isSending"
        @keyup.enter="sendMessage" />
      <el-button type="success" @click="sendMessage" :disabled="isSending">发送</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { io } from "socket.io-client";
import { ref, nextTick } from 'vue';
import { useUserStore } from '@/store/user'; // 引入 Pinia Store
import { AckResponse } from '@/types/index'
// 定义 Message 类型
interface Message {
  sender: string;
  content: string;
}

// webSocket
const socket = io('http://localhost:3000', {
  // withCredentials: true,  // 如果你需要携带凭证（如 cookies）
  transports: ['websocket'],  // 强制使用 WebSocket 协议
});

// client-side
socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("disconnect", () => {
  console.log(socket.id); // undefined
});
// 响应式数据
const userName = 'User1';  // 用户名，假设为 User1
const messages = ref<Message[]>([]);
const newMessage = ref<string>('');
const isSending = ref<boolean>(false);
const messageList = ref<HTMLElement | null>(null);


// 用户信息
const userStore = useUserStore(); // 获取 Pinia Store

// 发送消息函数
const sendMessage = () => {
  if (newMessage.value.trim() === '') return;
  if (userStore.userInfo === null) {
    // 没有用户信息
    return
  }
  const { name } = userStore.userInfo
  isSending.value = true;


  // 连接成功后，向服务器发送消息
  socket.emit('message', {
    sender: name,
    content: newMessage.value
  }, (ack: AckResponse) => {
    if (ack.status === 'ok') {
      console.log('Message sent successfully:', ack.data);
    } else {
      console.error('Message failed to send:', ack.error);
    }
  });
  setTimeout(() => {
    messages.value.push({
      sender: name,
      content: newMessage.value
    });

    newMessage.value = '';  // 清空输入框
    isSending.value = false;
  }, 1000);  // 模拟网络延迟
};

const toScrollButtom = () => {
  // 滚动到最新消息
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  });
}
</script>

<style scoped>
.chat-room {
  width: 100%;
  height: 100%;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.message-list {
  min-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.message {
  margin: 5px 0;
}

.input-container {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 15px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>