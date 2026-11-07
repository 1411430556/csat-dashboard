<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  interface Quote {
    content: string
    from: string
  }

  // 每日一言（shwgij 随机诗词接口）：每次请求随机返回，刷新即换
  const API_URL = 'https://api.shwgij.com/api/randtext/get'
  // type=4 精选诗词、m=0；密钥来自 .env.local（VITE_ 前缀变量会打包进前端产物）
  const API_KEY = import.meta.env.VITE_HISTORY_API_KEY ?? ''
  // 请求失败时展示的预设兜底文案
  const FALLBACK: Quote = { content: '路漫漫其修远兮，吾将上下而求索', from: '屈原 · 离骚' }

  const quote = ref<Quote | null>(null)

  // 接口返回 JSON，text 格式为"诗句。——朝代・作者《出处》"，按最后一个 —— 拆分正文与出处
  function parsePayload(json: { data?: { text?: string } }): Quote | null {
    const text = json?.data?.text?.trim() ?? ''
    if (!text) return null
    const idx = text.lastIndexOf('——')
    return idx === -1
      ? { content: text, from: '' }
      : { content: text.slice(0, idx).trim(), from: text.slice(idx + 2).trim() }
  }

  async function load() {
    try {
      const url = new URL(API_URL)
      url.searchParams.set('key', API_KEY)
      url.searchParams.set('type', '4')
      url.searchParams.set('m', '0')
      // 8 秒超时：弱网挂起时及时回退预设文案，避免骨架屏永久停留
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error(String(res.status))
      const parsed = parsePayload(await res.json())
      if (!parsed || !parsed.content) throw new Error('empty')
      quote.value = parsed
    } catch {
      // 静默回退到预设文案，不打断页面
      quote.value = FALLBACK
    }
  }

  onMounted(load)
</script>

<template>
  <div class="dq">
    <div class="dq-card">
      <span class="dq-seal" aria-hidden="true">言</span>
      <Transition name="dq" mode="out-in">
        <span v-if="!quote" key="skel" class="dq-skel" aria-live="polite">每日一言加载中</span>
        <blockquote v-else key="quote" class="dq-body">
          <p class="dq-text">{{ quote.content }}</p>
          <cite v-if="quote.from" class="dq-from">—— {{ quote.from }}</cite>
        </blockquote>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
  .dq {
    margin-bottom: 20px;
  }

  .dq-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.94) 0%,
      rgba(250, 252, 246, 0.86) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.85);
    border-radius: 16px;
    box-shadow:
      inset 0 1px 0 #ffffff,
      0 2px 4px rgba(35, 46, 30, 0.04),
      0 20px 48px rgba(35, 46, 30, 0.09);
    backdrop-filter: blur(16px) saturate(1.05);
    -webkit-backdrop-filter: blur(16px) saturate(1.05);
    padding: 18px 22px;
    overflow: hidden;
    animation: dq-rise 0.55s 0.1s cubic-bezier(0.22, 0.61, 0.36, 1) both;
  }

  .dq-card::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid rgba(112, 173, 71, 0.28);
    border-radius: 12px;
    pointer-events: none;
  }

  .dq-seal {
    flex: none;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    background: linear-gradient(165deg, var(--green) 0%, var(--green-dark) 100%);
    color: #fff;
    font-family: 'LXGW WenKai', 'Kaiti SC', STKaiti, KaiTi, Georgia, serif;
    font-weight: 700;
    font-size: 1.125rem;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(91, 148, 56, 0.35);
    transform: rotate(-4deg);
  }

  .dq-body {
    margin: 0;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .dq-text {
    margin: 0;
    font-family: 'LXGW WenKai', 'Kaiti SC', STKaiti, KaiTi, Georgia, serif;
    font-size: 1.1rem;
    line-height: 1.75;
    color: var(--ink);
    letter-spacing: 0.02em;
  }

  .dq-text::before {
    content: '「';
    color: var(--green-dark);
    font-weight: 700;
    margin-right: 2px;
  }

  .dq-text::after {
    content: '」';
    color: var(--green-dark);
    font-weight: 700;
    margin-left: 2px;
  }

  .dq-from {
    color: var(--muted);
    font-size: 0.86rem;
    font-style: normal;
    white-space: nowrap;
  }

  .dq-skel {
    color: var(--muted);
    font-size: 0.95rem;
    letter-spacing: 0.14em;
    animation: dq-pulse 1.6s ease-in-out infinite;
  }

  @keyframes dq-rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes dq-pulse {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 0.8;
    }
  }

  /* 加载占位 → 正文：占位快速淡出，正文淡入 + 轻微上移归位 */
  .dq-enter-active {
    transition:
      opacity 0.4s ease-out,
      transform 0.4s ease-out;
  }

  .dq-leave-active {
    transition: opacity 0.15s ease;
  }

  .dq-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }

  .dq-leave-to {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .dq-card {
      animation: none;
    }

    .dq-enter-active,
    .dq-leave-active {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .dq-card {
      padding: 14px 16px;
      gap: 12px;
    }

    .dq-seal {
      width: 34px;
      height: 34px;
      font-size: 1rem;
    }

    .dq-text {
      font-size: 0.98rem;
    }

    .dq-from {
      white-space: normal;
    }
  }
</style>
