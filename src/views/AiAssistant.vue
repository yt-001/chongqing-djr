<script setup>
import { ref, nextTick, onUnmounted, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { chatAi, fetchAiGreetingRandom, fetchAiPromptsRandom } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const input = ref('')
const sending = ref(false)
const listRef = ref(null)
const thinking = ref(false)
const inputRef = ref(null)
const typing = ref(false)
const typingText = ref('')
let typingTimer = null
let greetingTimer = null
const greetingText = ref('你好，我是梁平文旅智能客服。可以帮你解答景点、美食、路线和出行相关问题。')
const messages = ref([])
const cacheKey = ref('ai_chat_history')
const cacheReady = ref(false)
const maxHistoryDays = 30
const defaultPrompts = [
  '梁平必去景点有哪些？',
  '推荐一条梁平一日游路线',
  '梁平特色美食有哪些？',
  '从高铁站到景区怎么走？'
]
const prompts = ref(defaultPrompts)
const promptKey = ref(0)

const scrollToBottom = async () => {
  await nextTick()
  if (!listRef.value) return
  listRef.value.scrollTop = listRef.value.scrollHeight
}

const send = async (preset) => {
  const text = String(preset ?? input.value).trim()
  if (!text || sending.value) return
  if (!userStore.isLoggedIn) {
    showToast({ message: '请先登录后再发送消息', position: 'top' })
    return
  }
  stopGreeting()
  stopTyping()
  messages.value.push({ role: 'user', content: text })
  saveHistory()
  if (!preset) input.value = ''
  sending.value = true
  thinking.value = true
  typing.value = false
  typingText.value = ''
  await scrollToBottom()
  try {
    const reply = await chatAi({ message: text })
    const finalText = reply || '暂时没有合适的回答'
    startTyping(finalText)
  } catch (e) {
    showToast('发送失败')
  } finally {
    sending.value = false
    thinking.value = false
    await scrollToBottom()
  }
}

const focusInput = () => {
  inputRef.value?.focus?.()
}

const startTyping = (text) => {
  typing.value = true
  typingText.value = ''
  const speed = 24
  let index = 0
  if (typingTimer) clearInterval(typingTimer)
  typingTimer = setInterval(async () => {
    index += 1
    typingText.value = text.slice(0, index)
    if (index >= text.length) {
      clearInterval(typingTimer)
      typingTimer = null
      typing.value = false
      messages.value.push({ role: 'assistant', content: text })
      saveHistory()
      typingText.value = ''
      await scrollToBottom()
    } else {
      await scrollToBottom()
    }
  }, speed)
}

const stopTyping = () => {
  if (typingTimer) clearInterval(typingTimer)
  typingTimer = null
  typing.value = false
  typingText.value = ''
}

const stopGreeting = () => {
  if (greetingTimer) clearTimeout(greetingTimer)
  greetingTimer = null
  if (thinking.value) thinking.value = false
}

onMounted(async () => {
  cacheKey.value = buildCacheKey()
  loadHistory()
  cacheReady.value = true
  thinking.value = true
  try {
    const greeting = await fetchAiGreetingRandom()
    if (greeting) greetingText.value = greeting
  } catch (_) {}
  try {
    const list = await fetchAiPromptsRandom(4)
    if (Array.isArray(list) && list.length) {
      prompts.value = list
      promptKey.value = Date.now()
    }
  } catch (_) {}
  greetingTimer = setTimeout(() => {
    thinking.value = false
    startTyping(greetingText.value)
    greetingTimer = null
  }, 500)
})

onUnmounted(() => {
  if (typingTimer) clearInterval(typingTimer)
  if (greetingTimer) clearTimeout(greetingTimer)
})

function buildCacheKey() {
  const userId = userStore.user?.id || 'guest'
  return `ai_chat_history_${userId}`
}

function loadHistory() {
  const raw = localStorage.getItem(cacheKey.value)
  if (!raw) return
  try {
    const payload = JSON.parse(raw)
    if (!payload || !Array.isArray(payload.messages)) return
    if (isExpired(payload.savedAt)) {
      localStorage.removeItem(cacheKey.value)
      return
    }
    messages.value = payload.messages
    scrollToBottom()
  } catch (_) {
    localStorage.removeItem(cacheKey.value)
  }
}

function saveHistory() {
  if (!cacheReady.value) return
  const payload = {
    savedAt: Date.now(),
    messages: messages.value.slice(-200),
  }
  localStorage.setItem(cacheKey.value, JSON.stringify(payload))
}

function isExpired(savedAt) {
  if (!savedAt) return true
  const ttlMs = maxHistoryDays * 24 * 60 * 60 * 1000
  return Date.now() - Number(savedAt) > ttlMs
}
</script>

<template>
  <div class="ai-page">
    <div class="ai-header">
      <div class="ai-header__top">
        <van-icon name="arrow-left" class="ai-back" @click="router.back()" />
        <div class="ai-title">智能客服</div>
        <div class="ai-badge">梁平文旅</div>
      </div>
      <div class="ai-header__card">
        <div class="ai-card__title">你好，我是梁平文旅智能客服</div>
        <div class="ai-card__desc">可咨询景点、美食、路线、交通与出行建议</div>
      </div>
      <div class="ai-prompts" :key="promptKey">
        <div v-for="(p, i) in prompts" :key="`${promptKey}-${i}`" class="ai-chip" :style="{ '--delay': `${i * 0.06}s` }" @click="send(p)">{{ p }}</div>
      </div>
    </div>
    <div class="ai-list" ref="listRef" @click="focusInput">
      <div v-for="(msg, idx) in messages" :key="idx" class="ai-item" :class="msg.role">
        <div class="ai-avatar" v-if="msg.role === 'assistant'">AI</div>
        <div class="ai-bubble">{{ msg.content }}</div>
        <div class="ai-avatar user" v-if="msg.role === 'user'">我</div>
      </div>
      <div v-if="thinking" class="ai-item assistant">
        <div class="ai-avatar">AI</div>
        <div class="ai-bubble thinking">
          <span class="typing-dots"><i></i><i></i><i></i></span>
        </div>
      </div>
      <div v-if="typing" class="ai-item assistant">
        <div class="ai-avatar">AI</div>
        <div class="ai-bubble typing">{{ typingText }}</div>
      </div>
    </div>
    <div class="ai-input">
      <van-field ref="inputRef" v-model="input" placeholder="请输入问题，例如：梁平有哪些必去景点" @keyup.enter="send()" clearable />
      <button class="send-btn" :disabled="sending || !input.trim()" @click="send()">
        <van-icon name="guide-o" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.ai-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f6f8fc;
}
.ai-header {
  padding: 14px 14px 8px;
  background: linear-gradient(180deg, #e9f0ff 0%, #f6f8fc 100%);
}
.ai-header__top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ai-back {
  font-size: 20px;
  color: #2f6bff;
}
.ai-title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: #1f2a44;
  text-align: center;
}
.ai-badge {
  font-size: 12px;
  color: #2f6bff;
  background: #e2ebff;
  padding: 4px 8px;
  border-radius: 999px;
}
.ai-header__card {
  margin-top: 12px;
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 6px 20px rgba(47,107,255,0.08);
}
.ai-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
}
.ai-card__desc {
  margin-top: 6px;
  font-size: 12px;
  color: #6b768f;
}
.ai-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.ai-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: #2f6bff;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(47,107,255,0.08);
  opacity: 0;
  transform: translateY(6px) scale(0.98);
  animation: aiChipIn 0.36s ease forwards;
  animation-delay: var(--delay, 0s);
}
@keyframes aiChipIn {
  0% { opacity: 0; transform: translateY(6px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.ai-list {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 8px 12px 12px;
}
.ai-item {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}
.ai-item.assistant {
  justify-content: flex-start;
}
.ai-item.user {
  justify-content: flex-end;
}
.ai-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e6efff;
  color: #2f6bff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  margin-top: 2px;
}
.ai-avatar.user {
  background: #dbe7ff;
  color: #1f6fff;
  margin-left: 6px;
  margin-right: 0;
}
.ai-bubble {
  max-width: 74%;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
}
.ai-item.assistant .ai-bubble {
  background: #ffffff;
  color: #333;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}
.ai-item.assistant .ai-bubble::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 12px;
  width: 10px;
  height: 10px;
  background: #fff;
  transform: rotate(45deg);
}
.ai-item.user .ai-bubble {
  background: linear-gradient(135deg, #2f6bff 0%, #4f8bff 100%);
  color: #fff;
}
.ai-item.user .ai-bubble::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 12px;
  width: 10px;
  height: 10px;
  background: #3a78ff;
  transform: rotate(45deg);
}
.ai-bubble.thinking {
  color: #6b768f;
  background: #f3f6ff;
}
.ai-bubble.typing {
  background: #ffffff;
  color: #2a3550;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 14px;
}
.typing-dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9aa8c7;
  display: inline-block;
  animation: typingDot 1s infinite ease-in-out;
}
.typing-dots i:nth-child(2) { animation-delay: 0.15s; }
.typing-dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes typingDot {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-4px); opacity: 1; }
}
.ai-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 16px;
  background: #fff;
  box-shadow: 0 -6px 16px rgba(0,0,0,0.04);
}
.ai-input :deep(.van-field__control) {
  font-size: 14px;
}
.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(47,107,255,0.35);
  background: #f7f9ff;
  color: #2f6bff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
}
.send-btn:active {
  transform: scale(0.97);
}
.send-btn:disabled {
  color: #9fb5ff;
  border-color: rgba(47,107,255,0.2);
  background: #f2f5ff;
}
</style>
