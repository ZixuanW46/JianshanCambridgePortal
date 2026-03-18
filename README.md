# Jianshan Portal - Next.js + CloudBase

这是一个基于 Next.js 和腾讯云开发 CloudBase 的全栈应用项目。

## 项目架构

### 技术栈
- **前端框架**: Next.js 16 (React 19)
- **UI 组件**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **后端服务**: 腾讯云开发 CloudBase
- **数据库**: CloudBase NoSQL 数据库
- **认证**: CloudBase 内置身份认证
- **存储**: CloudBase 云存储
- **部署**: CloudBase 静态网站托管

### CloudBase 资源配置

**环境信息**:
- 环境 ID: `cloud1-6gfr24p5f5b51c80`
- 环境别名: `cloud1`
- 区域: `ap-shanghai`
- 套餐: 个人版

**已启用服务**:
- ✅ NoSQL 文档型数据库
- ✅ 云存储 (CDN 加速)
- ✅ 云函数
- ✅ 静态网站托管

**控制台入口**:
- [环境概览](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/overview)
- [NoSQL 数据库](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/db/doc)
- [云存储](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/storage)
- [身份认证](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/identity)
- [静态托管](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/hosting)

### 最新部署
- **部署时间**: 2025-12-22 12:22 (UTC+8)
- **托管域名**: [cloud1-6gfr24p5f5b51c80-1392727235.tcloudbaseapp.com/sites/jianshan-app-portal-20251222](https://cloud1-6gfr24p5f5b51c80-1392727235.tcloudbaseapp.com/sites/jianshan-app-portal-20251222/?t=20251222-1222)
- **说明**: 通过 `npm run build` 生成 `out/` 并上传至 CloudBase 静态托管 `sites/jianshan-app-portal-20251222/` 子目录，若需刷新 CDN 请追加任意随机查询参数

## 本地开发

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### CloudBase SDK 使用

项目已集成 CloudBase Web SDK，可直接使用以下功能：

```typescript
import { auth, db, storage, callFunction } from '@/lib/cloudbase';

// 身份认证
const user = await auth.signInAnonymously(); // 匿名登录
// 或跳转到默认登录页
auth.toDefaultLoginPage();

// 数据库操作
const collection = db.collection('users');
await collection.add({ name: '张三', age: 20 });
const res = await collection.get();

// 云存储
const result = await storage({
  cloudPath: 'images/photo.jpg',
  filePath: file, // File 对象
});

// 调用云函数
const { result } = await callFunction({
  name: 'functionName',
  data: { key: 'value' }
});
```

## 部署到 CloudBase

### 方法一：静态导出 + 静态托管（推荐）

1. 修改 `next.config.ts` 启用静态导出:
```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
```

2. 构建项目:
```bash
npm run build
```

3. 使用 CloudBase CLI 部署（推荐）:

在确认已安装 CloudBase CLI (`npm i -g @cloudbase/cli`) 并登录 (`tcb login`) 后，执行以下命令将 `out` 目录部署到环境根目录：

```bash
tcb hosting deploy ./out -e cloud1-6gfr24p5f5b51c80
```

> 提示：如果只需部署到子目录（如 `/app`），可以将命令修改为 `tcb hosting deploy ./out /app -e cloud1-6gfr24p5f5b51c80`。

### 方法三：使用 cloudbaserc.json 配置部署

项目根目录已包含 `cloudbaserc.json` 配置文件。可以直接运行：

```bash
tcb hosting deploy
```

### 方法二：CloudRun 容器部署

适用于需要 SSR 或 API Routes 的场景，可使用 CloudBase CloudRun 进行容器化部署。

## 项目结构

```
JianshanAppPortal/
├── app/                    # Next.js App Router 页面
│   ├── dashboard/         # 仪表板页面
│   ├── login/             # 登录页面
│   ├── register/          # 注册页面
│   ├── apply/             # 申请页面
│   ├── acceptance/        # 验收页面
│   ├── welcome/           # 欢迎页面
│   └── faq/               # FAQ 页面
├── components/            # React 组件
│   └── ui/               # shadcn/ui 组件
├── lib/                   # 工具库
│   ├── cloudbase.ts      # CloudBase SDK 配置
│   └── utils.ts          # 工具函数
├── public/               # 静态资源
├── cloudbaserc.json      # CloudBase 配置文件
└── README.md             # 项目文档
```

## 功能特性

- 🔐 用户认证（登录/注册）
- 📊 数据管理仪表板
- 📝 申请与验收流程
- 💾 CloudBase NoSQL 数据库集成
- 🎨 现代化 UI 设计（shadcn/ui）
- 📱 响应式布局

## 维护指南

### 数据库集合管理
在 [NoSQL 数据库控制台](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/db/doc) 创建和管理集合。

### 身份认证配置
在 [身份认证控制台](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/identity/login-manage) 配置登录方式（邮箱、手机号、微信等）。

### Admin 用户设置

当前项目的 admin 权限不是在 Firebase Console 里手动勾选的，而是通过 Firebase Auth Custom Claims 设置的。

- 前端登录后会读取 `claims.admin`
- 若 `claims.admin === true`，登录成功后会直接跳转到 `/admin/dashboard`
- Firestore 规则也依赖 `request.auth.token.admin == true` 放行管理员读取全部申请

对应代码位置：

- `app/api/admin/set-admin/route.ts`
- `app/login/page.tsx`
- `lib/auth-context.tsx`
- `firestore.rules`

#### 给某个用户设置为 admin

调用现有接口：

```bash
curl -X POST https://portal.jianshanacademy.com/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "someone@example.com",
    "isAdmin": true,
    "secret": "你的 ADMIN_SETUP_SECRET"
  }'
```

说明：

- `email`: 目标用户邮箱
- `isAdmin: true`: 设为 admin
- `isAdmin: false`: 取消 admin
- `secret`: 需要与服务端环境变量 `ADMIN_SETUP_SECRET` 一致

#### 已验证示例

2026-03-18 已通过以下方式成功为 `leopold.dai.07@gmail.com` 设置 admin：

```bash
curl -X POST https://portal.jianshanacademy.com/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "leopold.dai.07@gmail.com",
    "isAdmin": true,
    "secret": "从本地或线上环境读取的 ADMIN_SETUP_SECRET"
  }'
```

接口成功返回后，目标用户需要退出并重新登录一次，刷新 Firebase ID token，之后会自动进入 admin dashboard。

#### 注意事项

- Firebase Console 目前不能直接在用户页面里手动编辑 custom claims
- 如果用户已经处于登录状态，claim 更新后通常不会立刻生效，必须重新登录
- 线上正式域名是 `https://portal.jianshanacademy.com`
- 当前 `app/api/admin/set-admin/route.ts` 中还保留了默认兜底 secret，仅建议开发阶段使用，生产环境应只依赖 `ADMIN_SETUP_SECRET`

### 云存储管理
在 [云存储控制台](https://tcb.cloud.tencent.com/dev?envId=cloud1-6gfr24p5f5b51c80#/storage) 管理文件和配置 CDN。

## 了解更多

- [Next.js 文档](https://nextjs.org/docs)
- [CloudBase 文档](https://cloud.tencent.com/document/product/876)
- [shadcn/ui 文档](https://ui.shadcn.com)
