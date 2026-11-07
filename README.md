# 探探团队在线满意度自动统计

上传客服会话明细 CSV，自动按固定名单计算满意度指标，并生成与 Excel 模板口径一致的统计图（2100 × 684），支持一键复制或下载 PNG。

## 功能

- 顶部「每日一言」随机诗词横幅（相见拾光开放接口），失败自动回退兜底文案
- 拖拽上传 CSV，自动识别 UTF-8 / GBK 编码
- 按固定 6 人名单统计个人数据，并汇总「团队」与「老人」两组
- 用 Canvas 直接绘制统计表：表头、汇总行、明细行、条件格式
- 支持复制图片到剪贴板、下载 PNG

## 技术栈

- Vue 3.5 + TypeScript 5.9
- Vite 8
- naive-ui 2.45
- Canvas 2D 绘制
- Prettier 统一代码风格

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（http://127.0.0.1:5173）
pnpm dev

# 生产构建
pnpm build

# 本地预览构建产物
pnpm preview
```

环境建议：Node.js ≥ 20.19，pnpm 12（`packageManager` 已固定为 `pnpm@12.5.1`）。

「每日一言」需在项目根目录创建 `.env.local`（已被 `.gitignore` 忽略），填入相见拾光接口密钥：

```bash
VITE_HISTORY_API_KEY=你的密钥
```

未配置密钥时接口请求失败，会自动展示预设兜底文案，不影响其他功能。

## 数据源要求

CSV 表头必须包含以下列（列名需完全一致）：

| 列名               | 必填 | 说明                                                    |
| ------------------ | ---- | ------------------------------------------------------- |
| 客服ID             | 是   | 形如 `王兰(1001)`，程序只取括号前的姓名                 |
| 关闭类型           | 是   | JSON 字符串，如 `{"id":1,"name":"客服主动关闭"}`        |
| 推平状态           | 是   | JSON 字符串，名称包含「已推平」即计入推评量             |
| 推平结果           | 是   | JSON 字符串，`id` 取值 1–5，对应非常不满意到非常满意    |
| 创建时间           | 否   | 用于在结果页显示统计周期，支持 `2026/1/2` 或 `2026-1-2` |
| 用户第一次说话时间 | 否   | 为空表示用户未发言即掉线，该记录会被剔除                |

解析规则：

- 支持标准 RFC 4180 CSV：引号包裹、字段内逗号与换行、双引号转义
- 关闭类型 / 推平状态 / 推平结果优先按 JSON 解析，失败时退回正则或原始字符串匹配
- 记录中「客服ID」为空的会跳过
- 存在「用户第一次说话时间」列时，该列为空的记录会被剔除（用户未发言即掉线）

## 统计口径

| 指标       | 计算方式                                               |
| ---------- | ------------------------------------------------------ |
| 服务量     | 该客服的记录条数                                       |
| 推评量     | 推平状态包含「已推平」的记录数                         |
| 推评率     | 推评量 / 服务量                                        |
| 主动关闭   | 关闭类型包含「客服主动关闭」的记录数                   |
| 用户关闭   | 关闭类型包含「用户主动关闭」的记录数                   |
| 满意总得分 | 5×非常满意 + 4×满意 + 3×一般 + 2×不满意 + 1×非常不满意 |
| 参评量     | 五个评价等级的数量之和                                 |
| 满意度     | 满意总得分 / 参评量 / 5                                |
| 参评率     | 参评量 / 推评量                                        |
| 人工推评率 | 主动关闭 / 服务量                                      |

汇总规则：

- **团队** = 名单中 6 人的合计
- **老人** = 名单前 4 人的合计
- 满意度低于 70%、参评率或人工推评率低于 30% 时，按模板条件格式标红
- 无有效数据时显示 `#DIV/0!`

名单固定写在 [src/lib/constants.ts](src/lib/constants.ts)，成员或「老人」划分变化时需同步修改。

## 项目结构

```text
src/
├── components/
│   └── DailyQuote.vue 每日一言随机诗词横幅
├── lib/
│   ├── constants.ts   名单、表头、布局尺寸与配色
│   ├── csv.ts         CSV 解析、编码识别与字段提取
│   ├── stats.ts       统计口径计算
│   ├── format.ts      百分比、日期格式化与统计周期
│   └── render.ts      Canvas 统计图绘制
├── views/
│   └── HomeView.vue   上传页与结果页
├── App.vue            全局主题与 naive-ui Provider
└── main.ts            应用入口
```

## 可用脚本

| 命令                | 说明                       |
| ------------------- | -------------------------- |
| `pnpm dev`          | 启动开发服务器             |
| `pnpm build`        | 生产构建，输出到 `dist/`   |
| `pnpm preview`      | 预览构建产物               |
| `pnpm type-check`   | 运行 `vue-tsc` 类型检查    |
| `pnpm format`       | 用 Prettier 格式化全部文件 |
| `pnpm format:check` | 校验格式，不修改文件       |

## 部署到 GitHub Pages

推送到 `main` 分支会自动触发 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：

1. 检出代码，用 pnpm 安装依赖（版本取自 `package.json` 的 `packageManager`）
2. 运行 `pnpm type-check` 与 `pnpm build`
3. 将 `dist/` 作为 Pages 制品上传并部署

构建时通过仓库 Secret 注入「每日一言」密钥：在 **Settings → Secrets and variables → Actions** 添加 `VITE_HISTORY_API_KEY`；未配置时线上同样回退为兜底文案。

首次使用需在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。部署完成后站点地址为：

```text
https://<用户名>.github.io/csat-dashboard/
```

构建使用 `base: './'`，资源均为相对路径，可直接在子路径下访问；也可在 Actions 页面手动触发（`workflow_dispatch`）。

## 注意事项

- 安装依赖时可能看到 `ERR_PNPM_IGNORED_BUILDS`：这是 pnpm 12 拦截依赖构建脚本的安全策略，涉及的可选依赖 `node-pty` 不影响本项目运行
- 「复制图片」依赖 Clipboard API，需在 `localhost` 或 HTTPS 环境下使用；其他环境请使用「下载 PNG」
- 构建时 `base: './'`，`dist` 目录可直接以静态文件方式部署
