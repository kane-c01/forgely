# @forgely/compliance

> Compliance Agent + 规则库 (T29)
>
> MASTER.md 第 15 章 — 在每次站点生成 / 每次内容更新时执行 9-step 法律合规审查。

## 核心模块

```text
src/
├── types.ts            # ComplianceReport / Finding / Rule 等
├── engine.ts           # runRules() — 纯函数规则引擎
├── agent.ts            # ComplianceAgent — 接 Claude / Vision
├── autofix.ts          # applyAutoFix() — 一键修复（追加型）
├── utils/pattern.ts    # 关键词 / 正则匹配 + Finding 工厂
├── rules/
│   ├── index.ts        # ALL_RULES 注册表 + 选择器
│   ├── general.ts      # 通用违规 (4 条)
│   ├── regional/       # 10 条地域 (FTC/FDA/COPPA/CPSIA/Prop65/GDPR/DSA/CE/ASA/CASL)
│   └── category/       # 5 条品类 (supplements/cosmetics/food/alcohol/cbd)
└── __tests__/          # vitest 单元测试
```

## 快速开始

```typescript
import { ComplianceAgent } from '@forgely/compliance'

const agent = ComplianceAgent.create()

const report = await agent.review({
  siteId: 'site_abc',
  regions: ['US-FTC', 'US-FDA', 'EU-GDPR'],
  category: 'supplements',
  items: [
    {
      path: 'product.123.description',
      type: 'product-description',
      text: 'Our daily blend supports a healthy stress response.',
    },
  ],
})

if (report.mustFix > 0) {
  console.error('部署被合规网关阻止', report.findings)
}
```

## 与 LLM / Vision 集成（DI）

```typescript
import { ComplianceAgent, type LlmClient } from '@forgely/compliance'

const llm: LlmClient = {
  async complete({ system, user, model }) {
    const res = await anthropic.messages.create({...})
    return { text: res.content[0].text }
  },
}

const agent = ComplianceAgent.create({ llm })
const report = await agent.review(content, { enhanceSuggestions: true })
```

## 部署门禁（Compiler / Deployer 集成）

```typescript
const gate = ComplianceAgent.gate(report)
if (!gate.allow) {
  throw new ForgelyError({ code: 'COMPLIANCE_BLOCKED', userMessage: gate.reason })
}
```

## 一键修复

`applyAutoFix(items, report)` 把所有 `autoFixable: true` 的 finding 应用到原内容上。

仅"追加型"修复（FDA disclaimer / Prop65 警告 / CHOKING HAZARD 等）会自动应用；
"改写型"（删除疾病宣称等）保留为 `notFixedFindings`，需要 LLM 介入。

## 规则总数

- 地域规则：14 条
- 品类规则：10 条
- 通用规则：4 条
- **共 28 条**（持续扩展中）

## 测试

```bash
pnpm --filter @forgely/compliance test
```
