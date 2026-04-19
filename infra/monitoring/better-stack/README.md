# Better Stack Uptime

声明式 monitor 列表 + 同步脚本。任何时候改了 [`monitors.json`](monitors.json)，就跑：

```bash
BETTER_STACK_API_TOKEN=your_token ./scripts/sync-better-stack.sh
```

## API token

在 <https://uptime.betterstack.com/team/api-tokens> 创建一个 token（需要 `monitors` 写权限）。

设置成 GitHub Repo Secret `BETTER_STACK_API_TOKEN`，未来 GitHub Actions 可以在 main push 时自动 sync。

## Monitor 类型说明

| 类型                   | 用途                                       |
| ---------------------- | ------------------------------------------ |
| `status`               | 任意成功状态码（2xx / 3xx）                |
| `expected_status_code` | 必须是指定码（如 200）                     |
| `keyword`              | 响应体必须包含指定字符串（如 `"ok":true`） |

## Heartbeats

`worker.*` heartbeat 由 services/worker / cron job 主动 POST 给 Better Stack：

```ts
// 在 services/worker 的 BullMQ worker.on('completed') 里：
await fetch(process.env.BETTER_STACK_HEARTBEAT_URL!, { method: 'POST' })
```

如果 5 分钟没收到 heartbeat，Better Stack 会立刻报警。

## Status Page

跑完 sync 后访问 <https://status-forgely.betteruptime.com>。
