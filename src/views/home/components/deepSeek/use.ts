// useSpeech.ts
import { ref } from 'vue'

let audioContext: AudioContext
let scriptNode: ScriptProcessorNode
let ws: WebSocket | null = null

const isRecording = ref(false)

export async function startSpeechRecognition(wsUrl: string) {
  if (isRecording.value) return
  isRecording.value = true

  // 1. 创建 WebSocket 连接
  ws = new WebSocket(wsUrl)
  ws.binaryType = 'arraybuffer'

  ws.onopen = async () => {
    console.log('[WebSocket] 连接成功')

    // 2. 获取麦克风音频流
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 3. 创建 AudioContext 和 ScriptProcessorNode
    audioContext = new (window.AudioContext)({
      sampleRate: 16000 // 腾讯云要求 16KHz
    })
    const source = audioContext.createMediaStreamSource(stream)
    scriptNode = audioContext.createScriptProcessor(4096, 1, 1)

    // 4. 音频处理回调
    scriptNode.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer.getChannelData(0) // 单通道
      const pcmData = float32ToInt16(inputBuffer)

      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(pcmData)
      }
    }

    source.connect(scriptNode)
    scriptNode.connect(audioContext.destination)
  }

  ws.onmessage = (e) => {
    const result = JSON.parse(e.data)
    if (result?.Final && result.Text) {
      console.log('[语音识别结果]', result.Text)
    }
  }

  ws.onerror = (err) => {
    console.error('[WebSocket错误]', err)
  }

  ws.onclose = () => {
    console.log('[WebSocket] 已关闭')
  }
}

export function stopSpeechRecognition() {
  isRecording.value = false

  if (scriptNode) {
    scriptNode.disconnect()
  }

  if (audioContext) {
    audioContext.close()
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close()
  }
}

function float32ToInt16(float32Array: Float32Array): ArrayBuffer {
  const l = float32Array.length
  const buffer = new ArrayBuffer(l * 2)
  const view = new DataView(buffer)

  for (let i = 0; i < l; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true) // Little-endian
  }

  return buffer
}
