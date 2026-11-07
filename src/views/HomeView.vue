<template>
  <main class="page">
    <header class="hero">
      <span class="badge">
        <i class="badge-dot" aria-hidden="true"></i>
        客服满意度自动统计
      </span>
      <h1>探探团队在线满意度</h1>
      <p class="subtitle">上传数据源 CSV，自动计算满意度并生成可一键复制的统计图</p>
    </header>

    <DailyQuote />

    <n-card v-if="!hasResult" class="panel" :bordered="false">
      <div class="upload-zone">
        <n-upload
          directory-dnd
          accept=".csv"
          :show-file-list="false"
          :custom-request="handleUpload"
        >
          <n-upload-dragger class="dropzone">
            <span class="dropzone-icon-wrap">
              <svg
                class="dropzone-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 16V4" />
                <path d="M7 9l5-5 5 5" />
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              </svg>
            </span>
            <p class="dropzone-title">点击或拖拽 CSV 文件到此处</p>
            <p class="dropzone-tip">自动兼容 UTF-8 / GBK 编码，支持包含引号与换行的标准 CSV</p>
          </n-upload-dragger>
        </n-upload>

        <ul class="feature-chips">
          <li>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            自动识别编码
          </li>
          <li>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            计算满意度与推评率
          </li>
          <li>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            一键复制 / 下载统计图
          </li>
        </ul>
      </div>
    </n-card>

    <n-card v-else class="panel result-panel" :bordered="false">
      <template #header>
        <div>
          <h2 class="result-title">计算结果</h2>
          <div class="meta-chips">
            <span v-for="(part, index) in metaParts" :key="index" class="meta-chip">{{
              part
            }}</span>
          </div>
        </div>
      </template>
      <template #header-extra>
        <n-space>
          <n-button quaternary @click="reset">
            <template #icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </template>
            重新上传
          </n-button>
          <n-button @click="downloadImage">
            <template #icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 4v11" />
                <path d="M7 10l5 5 5-5" />
                <path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" />
              </svg>
            </template>
            下载 PNG
          </n-button>
          <n-button type="primary" @click="copyImage">
            <template #icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
              </svg>
            </template>
            复制图片
          </n-button>
        </n-space>
      </template>
      <div class="canvas-wrap">
        <canvas ref="canvasRef"></canvas>
      </div>
    </n-card>
  </main>
</template>

<script setup lang="ts">
  import { nextTick, ref, watch } from 'vue'
  import { NButton, NCard, NSpace, NUpload, NUploadDragger, useMessage } from 'naive-ui'
  import type { UploadCustomRequestOptions } from 'naive-ui'
  import { decodeFileBuffer, readRecords } from '../lib/csv'
  import { computeStats } from '../lib/stats'
  import type { Stats } from '../lib/stats'
  import { describePeriod } from '../lib/format'
  import { renderImage } from '../lib/render'
  import DailyQuote from '../components/DailyQuote.vue'

  const message = useMessage()
  const hasResult = ref(false)
  const metaParts = ref<string[]>([])
  const stats = ref<Stats | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  watch(
    stats,
    async value => {
      if (!value) return
      await nextTick()
      if (canvasRef.value) renderImage(canvasRef.value, value)
    },
    { flush: 'post' },
  )

  async function handleUpload({ file, onFinish }: UploadCustomRequestOptions) {
    if (file && file.file) await handleFile(file.file)
    onFinish()
  }

  async function handleFile(file: File) {
    try {
      if (!/\.csv$/i.test(file.name)) throw new Error('请上传 .csv 格式的文件')

      const buffer = await file.arrayBuffer()
      const decoded = decodeFileBuffer(buffer)
      const records = readRecords(decoded.text.replace(/^\uFEFF/, ''))
      if (records.length === 0) throw new Error('未解析到有效数据，请检查 CSV 内容')

      const parts = [file.name, records.length + ' 条记录']
      const period = describePeriod(records)
      if (period) parts.push(period)
      parts.push('编码 ' + decoded.encoding)

      metaParts.value = parts
      hasResult.value = true
      stats.value = computeStats(records)
    } catch (error) {
      message.error(
        error instanceof Error && error.message ? error.message : '文件解析失败，请检查 CSV 内容',
      )
    }
  }

  async function copyImage() {
    if (!canvasRef.value) return

    try {
      const blob = await canvasToBlob(canvasRef.value)
      if (!blob) throw new Error('图片生成失败')
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error('浏览器不支持复制图片')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      message.success('图片已复制，可直接粘贴到聊天或文档')
    } catch (error) {
      console.error('复制图片失败', error)
      message.error('当前环境无法复制图片，请使用「下载 PNG」')
    }
  }

  async function downloadImage() {
    if (!canvasRef.value) return

    try {
      const blob = await canvasToBlob(canvasRef.value)
      if (!blob) throw new Error('图片生成失败')
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = '探探团队在线满意度_' + timestamp() + '.png'
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    } catch (error) {
      message.error('图片下载失败，请重试')
    }
  }

  function reset() {
    hasResult.value = false
    stats.value = null
    metaParts.value = []
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  }

  function timestamp() {
    const now = new Date()
    const pad = (value: number) => String(value).padStart(2, '0')
    return (
      '' +
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      '-' +
      pad(now.getHours()) +
      pad(now.getMinutes())
    )
  }
</script>
