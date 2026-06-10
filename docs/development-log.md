# 今天吃啥开发日志

## 已完成的功能

目前项目已经完成第一版前端基础功能：

- 使用 React + Vite 创建项目
- 使用 JavaScript，不使用 TypeScript
- 配置 React Router 路由
- 首页路径：`/`
- 菜谱详情页路径：`/recipe/:id`
- 我的收藏页路径：`/favorites`
- 创建本地菜谱数据文件：`src/data/recipes.js`
- 本地菜谱数量不少于 20 道
- 首页随机推荐 3 道菜
- 首页支持“换一换”
- 首页“换一换”后显示提示：已为你换了一组推荐
- 菜谱卡片组件：`RecipeCard`
- 菜谱详情页：`RecipeDetail`
- 收藏页：`Favorites`
- 收藏数据使用 `localStorage`
- 收藏逻辑统一放在 `src/utils/storage.js`
- UI 做了移动端适配
- 底部导航固定在底部

## 当前项目结构

当前主要目录如下：

```text
src
├─ components
│  ├─ BottomNav.jsx
│  ├─ Header.jsx
│  └─ RecipeCard.jsx
├─ data
│  └─ recipes.js
├─ pages
│  ├─ Favorites.jsx
│  ├─ Home.jsx
│  └─ RecipeDetail.jsx
├─ utils
│  └─ storage.js
├─ App.jsx
├─ index.css
└─ main.jsx
```

新增文档目录：

```text
docs
├─ product-plan.md
├─ development-log.md
└─ codex-prompts.md
```

## 遇到的问题

### 1. 首页白屏

开发过程中曾经出现浏览器看不到首页的问题。原因是 `App.jsx` 中的注释和 `function App()` 挤在同一行，导致函数可能被注释掉。

解决方式：

- 重新整理 `App.jsx` 文件格式
- 保证注释和代码分行
- 重新运行构建检查

### 2. 收藏数据格式调整

一开始收藏数据保存的是完整菜谱对象，后面为了收藏页更清晰，改成保存菜谱 `id` 数组。

解决方式：

- 在 `storage.js` 中新增 `getFavorites()` 和 `saveFavorites()`
- 读取旧数据时兼容完整菜谱对象
- 收藏页根据 id 再从 `recipes.js` 查找完整菜谱

### 3. 本地命令偶尔启动失败

在当前 Windows 环境中，有些 PowerShell 命令偶尔会出现沙箱启动失败。这不是项目代码错误。

解决方式：

- 对关键验证命令重新运行
- 必要时使用提升权限运行 `npm run build`
- 每次功能完成后都尽量做构建验证

## 下一步计划

建议下一步按以下顺序继续：

1. 给首页增加分类筛选。
2. 给首页增加口味筛选。
3. 给菜谱数据增加更多字段，例如是否适合减脂、是否适合早餐。
4. 优化详情页的步骤展示，让每一步更容易阅读。
5. 给收藏页增加“清空收藏”功能。
6. 增加搜索功能。
7. 给项目增加 README，方便别人运行项目。
