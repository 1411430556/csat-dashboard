// 名单与模板 AA2:AA7 保持一致；elder 为 true 表示计入「老人整体达成」分组（模板取前 4 人）
export interface RosterMember {
  name: string
  elder: boolean
}

export const ROSTER: RosterMember[] = [
  { name: '王兰', elder: true },
  { name: '毛儀', elder: true },
  { name: '张宣雨', elder: true },
  { name: '张横舟', elder: true },
  { name: '王佳雪', elder: false },
  { name: '杨陈香', elder: false },
]

// 模板 AA1:AO1 表头
export const TABLE_HEADERS: string[] = [
  '',
  '服务量',
  '推评量',
  '推评率',
  '主动关闭',
  '用户关闭',
  '非常满意',
  '满意',
  '一般',
  '不满意',
  '非常不满意',
  '满意总得分',
  '参评量',
  '满意度',
  '参评率',
]

// 画布按 1x 坐标布局，导出时放大 scale 倍，2100 × 684 与模板截图一致
export const LAYOUT = { colWidth: 70, rowHeight: 19, rows: 18, cols: 15, scale: 2 }

export const COLORS = {
  header: '#70AD47',
  headerText: '#FFFFFF',
  headerLine: 'rgba(255, 255, 255, 0.22)',
  headerEdge: '#5B9438',
  zebra: '#F7FAF5',
  summaryGroup: '#E4EFDB',
  summaryElder: '#A9CF8F',
  summarySub: '#F2F8EC',
  summaryText: '#3C5C2A',
  pink: '#FDECEE',
  pinkText: '#B02A2A',
  border: '#E1E7DE',
  text: '#2A332B',
}

// 模板条件格式：满意度 < 70%、参评率/人工推评率 < 30% 时显示浅红填充 + 深红文字
export const THRESHOLD = { satisfaction: 0.7, reviewRate: 0.3 }

export const FONT_FAMILY =
  '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Source Han Sans SC", sans-serif'
export const FONT_SIZE = 13.33
