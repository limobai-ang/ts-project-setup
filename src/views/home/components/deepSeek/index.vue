<template>
  <div class="chat-container">
    <!-- 消息列表区域 -->
    <div class="messages" ref="messagesContainer">
      <el-scrollbar height="100%">
        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
          <div class="avatar">
            <!-- 根据角色显示不同头像 -->
            <el-avatar v-if="msg.role === 'assistant'"
              src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <el-avatar v-else src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          </div>
          <!-- 使用 v-html 渲染 Markdown 转换后的 HTML -->
          <div class="user-message" v-if="msg.role === 'user'" v-text="msg.content"></div>
          <div class="markdown-body" v-else v-html="md.render(msg.content)"></div>
        </div>
      </el-scrollbar>

    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <el-input v-model="newMessage" type="textarea" rows="2" placeholder="请输入你的消息..."
        @keyup.enter.exact="sendMessage" />
      <el-button @click="sendMessage" type="primary">发送</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { searchAI } from '@/apis/deepSeek/index'
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css"; // 代码高亮主题
// 定义消息接口
interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// 消息列表和输入消息
const messages = ref<Message[]>([
  {
    id: 1,
    role: 'assistant',
    content: '你好，我是 ChatGPT，有什么我可以帮助你的吗？'
  }
])
const newMessage = ref('')




// 引用 DOM 元素，便于滚动到底部
const messagesContainer = ref<HTMLElement | null>(null)

// 消息 id 生成器
let messageId = 2

// 滚动到消息列表底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 发送消息，并模拟获取助手回复
const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  const content = newMessage.value.trim()
  // 添加用户消息
  messages.value.push({
    id: messageId++,
    role: 'user',
    content,
    timestamp: new Date()
  })
  newMessage.value = ''
  scrollToBottom()

  // 模拟调用接口获取回复（实际项目中请调用后端 API）
  try {
    const reply = await searchAI({ content})
    console.log(reply, 'reply');
    
    messages.value.push({
      id: messageId++,
      role: 'assistant',
      content: reply.data,
      timestamp: new Date()
    })
  } catch (error) {
    messages.value.push({
      id: messageId++,
      role: 'assistant',
      content: '对不起，服务暂时不可用。',
      timestamp: new Date()
    })
  }
  scrollToBottom()
}

// 配置 markdown-it，支持代码高亮
const md: MarkdownIt = new MarkdownIt({
  highlight: (str: any, lang: any) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch (__) { }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});


</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* border: 1px solid #e0e0e0; */
  font-family: sans-serif;
}

.avatar {
  width: 40px;
  height: 40px;
  margin: 0 10px;
}

/* 消息列表区域 */
.messages {
  flex: 1;
  height: 90%;
  padding: 10px;
}

/* 单条消息样式 */
.message {
  display: flex;
  margin-bottom: 15px;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
}

.message.user {
  flex-direction: row-reverse;
  text-align: right;
}

.message.assistant {
  flex-direction: row;
  margin-right: 10px;
}

.user-message {
  color: #262626;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-break: break-word;
  background-color: #eff6ff;
  border-radius: 14px;
  max-width: calc(100% - 48px);
  padding: 10px 20px;
}

/* 输入区域 */
.input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #e0e0e0;
  background-color: #fff;
}

.input-area textarea {
  flex: 1;
  resize: none;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.input-area button {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: #409eff;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.input-area button:hover {
  background-color: #66b1ff;
}
</style>
