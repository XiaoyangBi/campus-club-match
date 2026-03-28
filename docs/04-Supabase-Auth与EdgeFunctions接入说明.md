# Supabase Auth与Edge Functions接入说明

## 本次改造内容
- 前端已接入`Supabase Auth`匿名登录
- landing页头部可触发匿名登录
- 学生端页面已改为鉴权守卫模式
- Edge Functions改为从JWT识别当前用户，不再依赖`demo-student`

## 你需要完成的Supabase配置

### 1. 开启匿名登录
进入Supabase控制台：
- `Authentication`
- `Providers`
- 开启`Anonymous Sign-Ins`

### 2. 配置前端环境变量
参考`frontend/.env.example`：

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. 配置Edge Functions Secrets
至少需要这些：

```bash
supabase secrets set AI_MATCH_API_KEY="请使用新的Claude兼容API key"
supabase secrets set AI_MATCH_API_URL="https://api.aiionly.com/v1/chat/completions"
supabase secrets set AI_MATCH_MODEL="claude-opus-4-6"
```

### 4. 推送数据库迁移
```bash
supabase db push
```

### 5. 部署云函数
```bash
supabase functions deploy student-demo-bootstrap
supabase functions deploy student-demo-profile
supabase functions deploy student-demo-favorites
supabase functions deploy student-demo-application
supabase functions deploy student-demo-ai-match
```

## 当前行为说明
- 未登录时，访问学生端业务页面会回到`/`
- 在`/`点击匿名进入后，会生成匿名用户身份
- 首次进入业务页时，会自动初始化该匿名用户的默认画像
- 之后画像、收藏、报名和AI匹配都绑定到该Supabase Auth用户
