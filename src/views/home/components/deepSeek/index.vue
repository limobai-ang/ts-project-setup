<template>
  <div class="chat-container">
    <div class="welcome-container">
      <Welcome variant="borderless"
        icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
        title="Hello, I'm Ant Design X"
        description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~">
        <template #extra>
          <el-button :icon="Edit" />
          <el-button :icon="Share" />
        </template>
      </Welcome>
    </div>
    <!-- 消息列表区域 -->
    <div class="messages" ref="messagesContainer">
      <BubbleList ref="listRef" :style="{ maxHeight: '600px' }" :roles="rolesAsObject" :items="messages"
        :auto-scroll="true" />
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <Sender v-model:value="newMessage" :auto-size="{ minRows: 2, maxRows: 6 }" :allow-speech="speechConfig"
        @submit="sendMessage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, h, computed, onMounted } from 'vue'
import { searchAI, voiceToText, getConnectUrl } from '@/apis/deepSeek/index'
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css"; // 代码高亮主题
import { Edit, Share } from '@element-plus/icons-vue'
import { BubbleList, Welcome, Sender, BubbleListProps } from 'ant-design-x-vue';
import { UserOutlined } from '@ant-design/icons-vue';
import { ElButton } from 'element-plus';
import { float32ToInt16 } from "@/utils/index";

// 定义消息接口
interface Message {
  key: number;
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

// 消息列表和输入消息
const messages = ref<Message[]>([
  {
    key: 1,
    role: 'ai',
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

const renderMarkdown: BubbleProps['messageRender'] = (content) => {
  return h('div', { innerHTML: md.render(content) })
}


const rolesAsObject: BubbleListProps['roles'] = {
  ai: {
    placement: 'start',
    avatar: { icon: h(UserOutlined), style: { background: '#fde3cf' } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: '600px',
    },
    messageRender: renderMarkdown,
  },
  user: {
    placement: 'end',
    avatar: { icon: h(UserOutlined), style: { background: '#87d068' } },
  },
};


// 初始化连接
let ws: WebSocket | null = null
const initWebSocket = (connectUrl) => {
  // 初始化连接（只 new 一次）
  ws = new WebSocket(connectUrl);

  ws.onopen = () => {
    // 开始录音并发送音频
    console.log('语音识别服务连接成功');

  };

  ws.onmessage = (e) => {
    const resultData = JSON.parse(e.data)
    if (resultData.message = "success" && resultData.result) {
      const { result } = resultData
      newMessage.value = result.voice_text_str
    }
  }

  ws.onerror = (err) => {
    console.error('[WebSocket错误]', err)
  }

  ws.onclose = () => {
    console.log('[WebSocket] 已关闭')
  }
}
// 语音识别配置

let audioContext: AudioContext
let scriptNode: ScriptProcessorNode

const startRecording = async () => {
  // 语音识别服务连接
  const connectUrl = await getConnectUrl()
  initWebSocket(connectUrl.data.url)

  // 1. 获取麦克风音频流
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

  // 2. 创建 AudioContext 和 ScriptProcessorNode
  audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16000 // 腾讯云要求 16KHz
  })
  const source = audioContext.createMediaStreamSource(stream)
  scriptNode = audioContext.createScriptProcessor(4096, 1, 1)

  // 3. 音频处理回调
  scriptNode.onaudioprocess = (event) => {
    // 处理音频数据
    const inputBuffer = event.inputBuffer.getChannelData(0) // 单通道
    const pcmData = float32ToInt16(inputBuffer)

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(pcmData)
    }
  }

  source.connect(scriptNode)
  scriptNode.connect(audioContext.destination)
}


function stopSpeechRecognition() {
  if (scriptNode) {
    scriptNode.disconnect()
  }

  if (audioContext) {
    audioContext.close()
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close()
    ws = null
  }
}
const stopRecording = () => {
  // 告诉腾讯“音频发完了”
  ws.send(JSON.stringify({ type: 'end' }));
  // 关闭连接
  stopSpeechRecognition()
}

const recording = ref(false);
const speechConfig = computed(
  () => ({
    // When setting `recording`, the built-in speech recognition feature will be disabled
    recording: recording.value,
    onRecordingChange: (nextRecording: boolean) => {
      if (nextRecording) {
        // console.log('开启语言输入');
        startRecording()
      } else {
        // console.log('关闭语言输入');
        stopRecording()
      }
      recording.value = nextRecording;
    },
  })
);

// 发送消息，并模拟获取助手回复
const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  const content = newMessage.value.trim()
  // 添加用户消息
  messages.value.push({
    key: messageId++,
    role: 'user',
    content,
    timestamp: new Date()
  })
  newMessage.value = ''


  // 添加助手回复login状态
  messages.value.push({
    key: messageId++,
    role: 'ai',
    loading: true,
    timestamp: new Date()
  })

  scrollToBottom()

  // 模拟调用接口获取回复（实际项目中请调用后端 API）
  try {
    const {data} = await searchAI({ content })
        
    // 删除助手的 loading 状态
    messages.value.pop()

    messages.value.push({
      key: messageId++,
      role: 'ai',
      content: data.data,

      timestamp: new Date()
    })
  } catch (error) {
    // 删除助手的 loading 状态
    messages.value.pop()

    messages.value.push({
      key: messageId++,
      role: 'ai',
      content: '对不起，服务暂时不可用。',
      timestamp: new Date()
    })
  }

  scrollToBottom()
}

</script>

<style scoped>
.chat-container {
  height: 100%;
  width: 100%;
  max-width: 1200px;
  margin: 0px auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
  font-family: sans-serif;
}

.welcome-container {
  padding: 2% 0;
}


/* 消息列表区域 */
.messages {
  flex: 1 1 0%;
}
</style>
