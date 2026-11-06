import { COLORS, FONT_FAMILY, FONT_SIZE, LAYOUT, TABLE_HEADERS, THRESHOLD } from './constants'
import { formatPercent } from './format'
import type { PersonStat, Stats } from './stats'

// 表格单元格：text 为空时只绘制底色与边框
interface Cell {
  text: string
  pink?: boolean
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  color?: string,
) {
  ctx.fillStyle = color || COLORS.text
  ctx.font = 'normal ' + FONT_SIZE + 'px ' + FONT_FAMILY
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, centerX, centerY + 0.5)
}

function fillBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 0.5
  ctx.beginPath()

  for (let i = 0; i <= LAYOUT.cols; i++) {
    const x = Math.min(i * LAYOUT.colWidth + 0.25, width - 0.25)
    ctx.moveTo(x, 0.25)
    ctx.lineTo(x, height - 0.25)
  }

  for (let j = 0; j <= LAYOUT.rows; j++) {
    const y = Math.min(j * LAYOUT.rowHeight + 0.25, height - 0.25)
    ctx.moveTo(0.25, y)
    ctx.lineTo(width - 0.25, y)
  }

  ctx.stroke()
}

function buildPersonCells(person: PersonStat): Cell[] {
  return [
    { text: person.name },
    { text: String(person.services) },
    { text: String(person.reviewed) },
    { text: formatPercent(person.reviewRate, 1) },
    { text: String(person.manualClose) },
    { text: String(person.userClose) },
    { text: String(person.ratings[5]) },
    { text: String(person.ratings[4]) },
    { text: String(person.ratings[3]) },
    { text: String(person.ratings[2]) },
    { text: String(person.ratings[1]) },
    { text: String(person.points) },
    { text: String(person.rated) },
    {
      text: formatPercent(person.satisfaction, 2),
      pink: person.satisfaction !== null && person.satisfaction < THRESHOLD.satisfaction,
    },
    {
      text: formatPercent(person.commentRate, 2),
      pink: person.commentRate !== null && person.commentRate < THRESHOLD.reviewRate,
    },
  ]
}

function drawPersonTable(ctx: CanvasRenderingContext2D, people: PersonStat[]) {
  const colWidth = LAYOUT.colWidth
  const rowHeight = LAYOUT.rowHeight

  // 表头行：模板 AA1:AO1 绿色填充，无边框
  fillBlock(ctx, 0, 0, colWidth * LAYOUT.cols, rowHeight, COLORS.header)
  TABLE_HEADERS.forEach((title, index) => {
    if (!title) return
    drawText(ctx, title, index * colWidth + colWidth / 2, rowHeight / 2)
  })

  people.forEach((person, rowIndex) => {
    const y = (rowIndex + 1) * rowHeight
    const cells = buildPersonCells(person)
    cells.forEach((cell, colIndex) => {
      const x = colIndex * colWidth
      fillBlock(ctx, x, y, colWidth, rowHeight, cell.pink ? COLORS.pink : '#FFFFFF')
      if (cell.text) {
        drawText(
          ctx,
          cell.text,
          x + colWidth / 2,
          y + rowHeight / 2,
          cell.pink ? COLORS.pinkText : COLORS.text,
        )
      }
      ctx.strokeStyle = COLORS.border
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, colWidth, rowHeight)
    })
  })
}

function drawMergedValue(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  rowSpan: number,
  text: string,
) {
  const colWidth = LAYOUT.colWidth
  const rowHeight = LAYOUT.rowHeight
  const x = col * colWidth
  const y = row * rowHeight
  const width = colWidth
  const height = rowHeight * rowSpan

  fillBlock(ctx, x, y, width, height, '#FFFFFF')

  // 模板中合并区域仅有上边框
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()

  drawText(ctx, text, x + width / 2, y + height / 2)
}

function drawSummary(ctx: CanvasRenderingContext2D, stats: Stats) {
  const colWidth = LAYOUT.colWidth
  const rowHeight = LAYOUT.rowHeight
  const top = 10 * rowHeight

  // 第 11-12 行：探探基础 / 个人达成 / 团队达成 / 老人整体达成
  fillBlock(ctx, 0, top, colWidth, rowHeight * 2, COLORS.summaryBlue)
  drawText(ctx, '探探基础', colWidth / 2, top + rowHeight)

  fillBlock(ctx, colWidth, top, colWidth * 2, rowHeight, COLORS.summaryBlue)
  drawText(ctx, '个人达成', colWidth * 2, top + rowHeight / 2)

  fillBlock(ctx, colWidth * 3, top, colWidth * 2, rowHeight, COLORS.summaryBlue)
  drawText(ctx, '团队达成', colWidth * 4, top + rowHeight / 2)

  fillBlock(ctx, colWidth * 6, top, colWidth * 2, rowHeight, COLORS.summaryGreen)
  drawText(ctx, '老人整体达成', colWidth * 7, top + rowHeight / 2)

  const subHeaders = [
    { col: 1, text: '满意度' },
    { col: 2, text: '人工推评率' },
    { col: 3, text: '满意度' },
    { col: 4, text: '人工推评率' },
    { col: 6, text: '满意度' },
    { col: 7, text: '人工推评率' },
  ]

  subHeaders.forEach(item => {
    const x = item.col * colWidth
    const y = top + rowHeight
    fillBlock(ctx, x, y, colWidth, rowHeight, COLORS.summarySub)
    drawText(ctx, item.text, x + colWidth / 2, y + rowHeight / 2)
  })

  // 第 13-18 行：个人达成（空白与低于阈值同样显示浅红，与模板条件格式一致）
  stats.people.forEach((person, index) => {
    const y = (12 + index) * rowHeight
    const personalSatisfaction = {
      text: person.satisfaction === null ? '' : formatPercent(person.satisfaction, 2),
      pink: person.satisfaction === null || person.satisfaction < THRESHOLD.satisfaction,
    }
    const personalManualRate = {
      text: person.manualRate === null ? '' : formatPercent(person.manualRate, 2),
      pink: person.manualRate === null || person.manualRate < THRESHOLD.reviewRate,
    }
    const cells: Cell[] = [{ text: person.name }, personalSatisfaction, personalManualRate]

    cells.forEach((cell, colIndex) => {
      const x = colIndex * colWidth
      fillBlock(ctx, x, y, colWidth, rowHeight, cell.pink ? COLORS.pink : '#FFFFFF')
      if (cell.text) {
        drawText(
          ctx,
          cell.text,
          x + colWidth / 2,
          y + rowHeight / 2,
          cell.pink ? COLORS.pinkText : COLORS.text,
        )
      }
      ctx.strokeStyle = COLORS.border
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, colWidth, rowHeight)
    })
  })

  // 团队 / 老人汇总：模板 AD13:AE16、AG13:AH16 为四行合并单元格
  drawMergedValue(ctx, 3, 12, 4, formatPercent(stats.team.satisfaction, 2))
  drawMergedValue(ctx, 4, 12, 4, formatPercent(stats.team.manualRate, 2))
  drawMergedValue(ctx, 6, 12, 4, formatPercent(stats.elder.satisfaction, 2))
  drawMergedValue(ctx, 7, 12, 4, formatPercent(stats.elder.manualRate, 2))
}

export function renderImage(canvas: HTMLCanvasElement, stats: Stats): HTMLCanvasElement {
  const scale = LAYOUT.scale
  const width = LAYOUT.colWidth * LAYOUT.cols
  const height = LAYOUT.rowHeight * LAYOUT.rows

  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')!
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, width, height)
  fillBlock(ctx, 0, 0, width, height, '#FFFFFF')

  drawGrid(ctx, width, height)
  drawPersonTable(ctx, stats.people)
  drawSummary(ctx, stats)

  return canvas
}
