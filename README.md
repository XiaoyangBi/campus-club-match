# 社团智能招新匹配平台

一个面向高校社团招新的全栈Demo平台，支持学生端智能匹配与报名、社团端处理申请、管理端审核社团与配置招新周期。

## 在线地址
- 线上站点：`https://campus-club-match.vercel.app`
- GitHub仓库：`https://github.com/XiaoyangBi/campus-club-match`

## 当前能力
- 学生端
  - Landing页、社团发现、社团详情、画像编辑、报名投递、消息中心
  - AI匹配推荐、最近一次匹配读取、匹配结果缓存
  - 收藏社团、上传简历、申请状态时间线、放弃报名
- 社团端
  - 查看负责社团
  - 处理报名状态流转
  - 维护社团资料
  - 发送面试通知、录取通知、未通过通知
- 管理端
  - 社团审核
  - 招新周期配置
  - 通知模板配置
  - 社团端/管理端角色权限控制
- 后端
  - Supabase Auth
  - Supabase Postgres + RLS
  - Supabase Edge Functions
  - Supabase Storage
  - Claude兼容API智能匹配

## 项目结构
```text
.
├── docs/                  产品与接入文档
├── frontend/              React + Vite + TypeScript前端
├── prototype/             早期单文件原型
├── supabase/              SQL migrations与Edge Functions
└── vercel.json            顶层部署配置
```

## 技术栈
- 前端：`React`、`TypeScript`、`Vite`、`react-router-dom`、`@tanstack/react-query`
- 后端：`Supabase Auth`、`Postgres`、`Edge Functions`、`Storage`
- AI：Claude兼容接口
- 部署：`Vercel`

## 本地开发

### 1. 安装前端依赖
```bash
cd frontend
npm install
```

### 2. 配置前端环境变量
参考`frontend/.env.example`创建`frontend/.env.local`：

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. 启动前端
```bash
cd frontend
npm run dev
```

### 4. 构建前端
```bash
cd frontend
npm run build
```

## Supabase配置

### 数据库迁移
```bash
supabase db push
```

### 云函数部署
```bash
supabase functions deploy workspace-access
supabase functions deploy student-demo-bootstrap
supabase functions deploy student-demo-profile
supabase functions deploy student-demo-favorites
supabase functions deploy student-demo-application
supabase functions deploy student-demo-application-withdraw
supabase functions deploy student-demo-ai-match
supabase functions deploy student-demo-ai-match-latest
supabase functions deploy student-demo-ai-match-history
supabase functions deploy student-demo-notifications
supabase functions deploy student-demo-notifications-read
supabase functions deploy club-workspace-bootstrap
supabase functions deploy club-workspace-application-status
supabase functions deploy club-workspace-club-profile
supabase functions deploy admin-workspace-bootstrap
supabase functions deploy admin-workspace-club-review
supabase functions deploy admin-workspace-cycle
```

### 需要的Secrets
```bash
supabase secrets set AI_MATCH_API_KEY="your-api-key"
supabase secrets set AI_MATCH_API_URL="https://api.aiionly.com/v1/chat/completions"
supabase secrets set AI_MATCH_MODEL="claude-opus-4-6"
```

## 测试阶段推荐设置

### 临时关闭邮箱验证
如果你现在主要是自己测试注册/登录流程，**建议临时关闭邮箱确认**，否则很容易遇到`email rate limit exceeded`。

Supabase后台操作路径：
1. 打开`Authentication`
2. 进入`Providers`
3. 选择`Email`
4. 关闭`Confirm email`

关闭后，注册账号通常会直接创建成功，不再依赖验证邮件。

注意：
- 这只适合开发测试阶段
- 正式上线前建议重新打开邮箱验证
- 正式上线建议配置自己的SMTP服务，而不是长期依赖默认邮件能力

## 角色权限说明
- 学生端：任意已注册用户可登录
- 社团端：先用真实邮箱注册账号，再由管理员写入`club_admin_memberships`授权进入
- 管理端：先用真实邮箱注册账号，再由管理员写入`platform_admin_users`授权进入

当前授权机制：
- `Supabase Auth`负责邮箱与密码
- 业务表负责角色与社团归属
- 权限校验优先按`user_id`匹配，并兼容历史邮箱授权记录自动绑定

## 自动部署
项目已连接GitHub与Vercel。

后续更新流程：
```bash
git add .
git commit -m "your update message"
git push
```

正常情况下，`push`到`main`后会自动触发Vercel重新部署。

## 后续建议
- 接入自定义域名
- 为正式环境接入SMTP邮件服务
- 在管理端补“角色授权管理UI”
- 补更完整的README截图和接口清单
