# 小花的建筑笔记

部署在 GitHub Pages 的极简建筑阅读网站。

## 内容结构

- `index.html`：文章列表、分类与全文关键词搜索
- `articles/`：各篇文章的独立页面
- `assets/images/`：文章图片
- `assets/site.js`：浏览器端搜索与分类
- `CNAME`：GitHub Pages 自定义域名 `doubling.cc`

## 发布新文章

1. 在 `articles/` 下复制一篇文章目录并编辑 `index.html`。
2. 把图片放入 `assets/images/`。
3. 在首页增加文章卡片，并在 `assets/site.js` 的 `articles` 数组加入同一篇文章的搜索信息。
4. 提交到 `main` 分支。GitHub Pages 会自动更新。

网站只使用 Apple 系统字体栈，不加载第三方字体。
