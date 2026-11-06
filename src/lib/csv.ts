// CSV 中的一条客服会话记录（仅保留统计所需字段）
export interface CsvRecord {
  agent: string
  closeType: string
  state: string
  rating: number
  created: string
}

export interface DecodedText {
  text: string
  encoding: string
}

function decodeBuffer(buffer: ArrayBuffer | Uint8Array): DecodedText {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'UTF-8' }
  } catch (error) {
    return { text: new TextDecoder('gb18030').decode(bytes), encoding: 'GBK' }
  }
}

// 标准 RFC 4180 解析：支持引号包裹、字段内逗号 / 换行、双引号转义
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let index = 0

  while (index < text.length) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        index += 1
        continue
      }
      field += char
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      index += 1
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      index += 1
      continue
    }

    if (char === '\r') {
      index += 1
      continue
    }

    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      index += 1
      continue
    }

    field += char
    index += 1
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

// 关闭类型、推平状态均为 {"id":x,"name":"..."}，优先解析 JSON，失败时退回字符串匹配
function readFieldName(raw: string | undefined): string {
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.name === 'string') return parsed.name
  } catch (error) {
    // 非标准 JSON 时走下面的字符串匹配
  }
  const matched = raw.match(/"name"\s*:\s*"([^"]*)"/)
  return matched ? matched[1] : raw
}

// 推平结果为 {"id":5,"name":"非常满意"}，取 id 判定评价等级
function readFieldId(raw: string | undefined): number {
  if (!raw) return 0
  try {
    const parsed = JSON.parse(raw)
    if (parsed && parsed.id !== undefined) return Number(parsed.id) || 0
  } catch (error) {
    // 非标准 JSON 时走下面的字符串匹配
  }
  const matched = raw.match(/"id"\s*:\s*(\d+)/)
  return matched ? Number(matched[1]) : 0
}

export function readRecords(text: string): CsvRecord[] {
  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error('CSV 内容为空或格式不正确')

  const headers = rows[0].map(header => header.trim())
  const required = ['客服ID', '关闭类型', '推平状态', '推平结果']
  const missing = required.filter(name => headers.indexOf(name) === -1)
  if (missing.length > 0) throw new Error('缺少必需列：' + missing.join('、'))

  const agentIndex = headers.indexOf('客服ID')
  const closeIndex = headers.indexOf('关闭类型')
  const stateIndex = headers.indexOf('推平状态')
  const resultIndex = headers.indexOf('推平结果')
  const createdIndex = headers.indexOf('创建时间')
  // 该列为空代表用户没说话就掉线，不计入统计
  const firstSpeakIndex = headers.indexOf('用户第一次说话时间')

  const records: CsvRecord[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const rawAgent = (row[agentIndex] || '').trim()
    if (!rawAgent) continue
    if (firstSpeakIndex !== -1 && (row[firstSpeakIndex] || '').trim() === '') continue
    records.push({
      agent: rawAgent.split('(')[0].trim(),
      closeType: readFieldName(row[closeIndex]),
      state: readFieldName(row[stateIndex]),
      rating: readFieldId(row[resultIndex]),
      created: createdIndex === -1 ? '' : row[createdIndex] || '',
    })
  }

  return records
}

export function decodeFileBuffer(buffer: ArrayBuffer): DecodedText {
  return decodeBuffer(buffer)
}
