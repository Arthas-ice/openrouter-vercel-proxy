# OpenRouter Vercel Proxy

一个可直接部署到 Vercel 的 Next.js + TypeScript 项目：
- 前端调用 `/api/chat`
- 服务端转发到 OpenRouter
- API Key 保存在服务端环境变量中
- 可继续扩展鉴权、限流、日志

## 本地启动

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 http://localhost:3000

## 部署到 Vercel

1. 推到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量：
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_BASE_URL`
   - `OPENROUTER_APP_NAME`
   - `OPENROUTER_SITE_URL`
   - `ALLOWED_ORIGINS`
   - `DEFAULT_MODEL`
4. 点击部署

## 调用示例

```ts
await fetch("https://your-domain.vercel.app/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    stream: false,
    messages: [{ role: "user", content: "你好" }]
  })
});
```

## 建议下一步

1. 给 `/api/chat` 增加你自己的客户端 API Key
2. 接入 Redis 做限流
3. 增加 usage logging
4. 支持按用户控制模型白名单
