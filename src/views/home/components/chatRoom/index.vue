<template>
  <div class="chat-room">
    <div class="message-list">
      <!-- <div v-for="(message, index) in messages" :key="index" class="message">
        <strong>{{ message.sender }}:</strong>
        <span>{{ message.content }}</span>
      </div> -->

      <template v-for="(item, index) in messages" :key="index">
        <div class="list-row" v-if="item.type === 'message'" :class="{ myMassageRow: item.isMyMessage }">
          <el-avatar class="avatar" shape="square" :size="40" fit="cover" :src="url" />
          <div class="content">
            <div class="name" v-if="!item.isMyMessage">{{ item.user.name }}</div>
            <div class="massage">
              <div class="text">{{ item.content }}</div>
            </div>
          </div>
        </div>

        <div class="list-info" v-else>
          <div class="message-info">{{ item.content }}</div>
        </div>
      </template>
    </div>

    <div class="input-container">
      <el-input v-model="newMessage" :rows="2" type="text" placeholder="Type a message" :disabled="isSending"
        @keyup.enter="handleSendMessage" />
      <el-button type="success" @click="handleSendMessage" :disabled="isSending">发送</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { io } from "socket.io-client";
import { ref, nextTick, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/store/user'; // 引入 Pinia Store
import { AckResponse } from '@/types/index'
// 定义 Message 类型
interface BaseMessage {
  type: 'info';
  isMyMessage?: never; // 当类型为 'info' 时，不能传 isMyMessage
  user: {
    name: string;
    _id: string;
    socketId: string;
  };
  content: string;
}

interface MessageWithType {
  type: 'message';
  isMyMessage: boolean; // 当类型为 'message' 时，必须传 isMyMessage
  user: {
    name: string;
    _id: string;
    socketId: string;
  };
  content: string;
}

type Message = BaseMessage | MessageWithType;
const url = 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
// 响应式数据
const messages = ref<Message[]>([]);
const newMessage = ref<string>('');
const isSending = ref<boolean>(false);
const messageListElement = ref<HTMLElement | null>(null);

// 用户信息
const userStore = useUserStore(); // 获取 Pinia Store

const { name, _id } = userStore.userInfo ? userStore.userInfo : {}

// webSocket连接
const socket = io('http://localhost:3000', {
  // withCredentials: true,  // 如果你需要携带凭证（如 cookies）
  transports: ['websocket'],  // 强制使用 WebSocket 协议

  auth: {
    _id: _id,
    name: name,
  },
});

socket.on("connect", () => {

});
socket.on("disconnect", () => {

});

socket.on("addUser", (message) => {
  const content = `${message.user.name}进入了`
  messages.value.push({
    type: 'info',
    user: message.user,
    content
  })
});
socket.on("removeUser", (message) => {
  const content = `${message.user.name}退出了`
  messages.value.push({
    type: 'info',
    user: message.user,
    content
  })
});

socket.on("onlineUsers", (message) => {
  console.log('在线用户数据', message);
});

// 广播事件
socket.on('broadcastToOthers', (message) => {
  messages.value.push({
    type: 'message',
    user: message.user,
    isMyMessage: false,
    content: message.content
  });
});



// 封装 sendMessage 方法
const sendMessage = <T = any>(
  event: string,
  message: any
): Promise<AckResponse<T>> => {
  return new Promise((resolve, reject) => {
    // 发送消息并处理回调
    socket.emit(event, message, (ack: AckResponse<T>) => {
      if (ack.status === 'ok') {
        resolve(ack); // 成功时 resolve
      } else {
        reject(new Error(ack.error || 'Unknown error')); // 失败时 reject
      }
    });
  });
};

// 发送消息函数
const handleSendMessage = () => {
  if (newMessage.value.trim() === '') return;
  if (userStore.userInfo === null) {
    // 没有用户信息
    return
  }
  isSending.value = true;

  sendMessage('message', {
    user: { name, _id, socketId: socket.id },
    content: newMessage.value
  }).then(res => {
    messages.value.push({
      type: 'message',
      user: res.data.user,
      isMyMessage: true,
      content: res.data.content
    });

    newMessage.value = '';  // 清空输入框
    isSending.value = false;

    toScrollButtom()
  })
};

const toScrollButtom = () => {
  // 滚动到最新消息
  nextTick(() => {
    if (messageListElement.value) {
      messageListElement.value.scrollTop = messageListElement.value.scrollHeight;
    }
  });
}


onBeforeUnmount(() => {
  if (socket) {
    socket.emit('client-disconnect', {
      _id: _id,
      name: name,
    });
    socket.disconnect();
  }
});
</script>

<style scoped lang="scss">
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

  .list-row {
    display: flex;

    /* 整体水平翻转 */
    .content {
      margin-left: 10px;

      .name {
        vertical-align: top;
        size: 12px;
        color: #ccc;
      }

      .massage {
        max-width: 300px;
        margin-left: 10px;
        background-color: #fff;
        padding: 8px;
        border-radius: 4px;
        position: relative;
        overflow-wrap: break-word;
        /* 或者使用 word-break */
        word-break: break-all;

        /* 保持不换行 */
        &::before {
          position: absolute;
          top: 10px;
          left: -19px;
          content: '';
          display: block;
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid #fff;
          border-bottom: 10px solid transparent;
          border-top: 10px solid transparent;
        }

        .text {}
      }
    }
  }

  .list-info {
    padding: 10px 0;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    .message-info {
      background-color: #ddd;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
    }
  }
}

.myMassageRow {
  transform: scaleX(-1);

  .name,
  .text,
  .avatar {
    transform: scaleX(-1);
    /* 再次翻转子元素，保持文字正常显示 */
    text-align: right;
  }

  .massage {
    background-color: #4caf50 !important;
    &::before {
      border-right: 10px solid #4caf50 !important;
    }
  }
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