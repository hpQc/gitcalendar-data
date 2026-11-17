# gitcalendar-data

博客 `https://blog.qwqsky.top/` 的 GitHub 贡献日历数据源。

- 数据文件：`gitcalendar.json`（结构 `{ total, contributions: [53 周][<=7 天] }`，日期字段 `date`、次数 `count`）
- 生成方式：GitHub Actions 每天 04:23（北京时间）跑 `build.js`，数据取 `github-contributions-api.jogruber.de`，有变化才提交
- 手动刷新：Actions → `update-gitcalendar` → Run workflow
- 站点侧：`_config.yml` 的 `gitcalendar.jsonurl` 指向本仓库 `main` 分支的 raw 地址；前端 `js/gitcalendar.js` 直接 fetch 这份 JSON，不需要重新构建站点

## 本地运行

```bash
node build.js
```
