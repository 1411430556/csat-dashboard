import { ROSTER } from './constants'
import type { CsvRecord } from './csv'

// 评价等级由「推平结果」的 id 决定：5 非常满意 ~ 1 非常不满意
export type Rating = 1 | 2 | 3 | 4 | 5
export type RatingCounts = Record<Rating, number>

// 单人累计计数（计算过程中的中间态）
interface PersonCounters {
  name: string
  elder: boolean
  services: number
  reviewed: number
  manualClose: number
  userClose: number
  ratings: RatingCounts
}

export interface PersonStat {
  name: string
  elder: boolean
  services: number
  reviewed: number
  manualClose: number
  userClose: number
  ratings: RatingCounts
  points: number
  rated: number
  reviewRate: number | null
  satisfaction: number | null
  commentRate: number | null
  manualRate: number | null
}

export interface Aggregate {
  services: number
  manualClose: number
  points: number
  rated: number
  satisfaction: number | null
  manualRate: number | null
}

export interface Stats {
  people: PersonStat[]
  team: Aggregate
  elder: Aggregate
}

function isRating(value: number): value is Rating {
  return value >= 1 && value <= 5
}

// 与模板 COUNTIFS 口径一致
export function computeStats(records: CsvRecord[]): Stats {
  const base = new Map<string, PersonCounters>()
  ROSTER.forEach(item => {
    base.set(item.name, {
      name: item.name,
      elder: item.elder,
      services: 0,
      reviewed: 0,
      manualClose: 0,
      userClose: 0,
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    })
  })

  records.forEach(record => {
    const stat = base.get(record.agent)
    if (!stat) return
    stat.services += 1
    if (record.state.indexOf('已推平') !== -1) stat.reviewed += 1
    if (record.closeType.indexOf('客服主动关闭') !== -1) stat.manualClose += 1
    if (record.closeType.indexOf('用户主动关闭') !== -1) stat.userClose += 1
    if (isRating(record.rating)) stat.ratings[record.rating] += 1
  })

  const people = ROSTER.map(item => {
    // 名单固定，上面的初始化保证每个名字都存在
    const stat = base.get(item.name)!
    const points =
      stat.ratings[5] * 5 +
      stat.ratings[4] * 4 +
      stat.ratings[3] * 3 +
      stat.ratings[2] * 2 +
      stat.ratings[1]
    const rated =
      stat.ratings[5] + stat.ratings[4] + stat.ratings[3] + stat.ratings[2] + stat.ratings[1]
    return {
      name: stat.name,
      elder: stat.elder,
      services: stat.services,
      reviewed: stat.reviewed,
      manualClose: stat.manualClose,
      userClose: stat.userClose,
      ratings: stat.ratings,
      points: points,
      rated: rated,
      reviewRate: stat.services > 0 ? stat.reviewed / stat.services : null,
      satisfaction: rated > 0 ? points / rated / 5 : null,
      commentRate: stat.reviewed > 0 ? rated / stat.reviewed : null,
      manualRate: stat.services > 0 ? stat.manualClose / stat.services : null,
    }
  })

  return {
    people: people,
    team: aggregate(people),
    elder: aggregate(people.filter(person => person.elder)),
  }
}

function aggregate(list: PersonStat[]): Aggregate {
  let services = 0
  let manualClose = 0
  let points = 0
  let rated = 0

  list.forEach(item => {
    services += item.services
    manualClose += item.manualClose
    points += item.points
    rated += item.rated
  })

  return {
    services: services,
    manualClose: manualClose,
    points: points,
    rated: rated,
    satisfaction: rated > 0 ? points / rated / 5 : null,
    manualRate: services > 0 ? manualClose / services : null,
  }
}
