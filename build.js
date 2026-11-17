'use strict';

/**
 * 生成 hexo-filter-gitcalendar 需要的静态数据：
 *   { total: number, contributions: [ week0..week52 ][ day0..day6 ] }，每天 { date, count }
 *
 * 前端约定（source/js/gitcalendar.js）：
 *   - contributions 是「周数组」，[0] 最早、[52] 本周；
 *   - contributions[52].length - 1 即今天在周内的下标，所以最后一周只写到今天，不补满 7 天。
 *
 * 数据源：github-contributions-api.jogruber.de（公开、带 CORS、无需 token）。
 */

const fs = require('fs');
const path = require('path');

const USER = process.env.GITCAL_USER || 'hpQc';
const SOURCE = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;
const OUT = path.join(__dirname, 'gitcalendar.json');

function toWeeks(days) {
  const map = new Map(days.map((d) => [d.date, Number(d.count) || 0]));
  const last = new Date(`${days[days.length - 1].date}T00:00:00Z`);
  const lastSunday = new Date(last);
  lastSunday.setUTCDate(last.getUTCDate() - last.getUTCDay());

  const weeks = [];
  for (let w = 52; w >= 0; w--) {
    const start = new Date(lastSunday);
    start.setUTCDate(lastSunday.getUTCDate() - w * 7);
    const limit = w === 0 ? last.getUTCDay() + 1 : 7;
    const entries = [];
    for (let i = 0; i < limit; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      entries.push({ date: key, count: map.get(key) || 0 });
    }
    weeks.push(entries);
  }
  return weeks;
}

(async () => {
  const res = await fetch(SOURCE, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`source HTTP ${res.status}`);
  const payload = await res.json();
  if (!Array.isArray(payload.contributions) || payload.contributions.length < 360) {
    throw new Error('unexpected payload shape');
  }
  payload.contributions.sort((a, b) => (a.date < b.date ? -1 : 1));

  const weeks = toWeeks(payload.contributions);
  if (weeks.length !== 53) throw new Error(`week count = ${weeks.length}`);

  const total = weeks.reduce((sum, wk) => sum + wk.reduce((s, d) => s + d.count, 0), 0);
  fs.writeFileSync(OUT, JSON.stringify({ total, contributions: weeks }, null, 0) + '\n', 'utf8');
  console.log(`written ${OUT}  total=${total}  weeks=${weeks.length}  first=${weeks[0][0].date}  last=${weeks[52].slice(-1)[0].date}`);
})().catch((e) => {
  console.error('build failed:', e.message);
  process.exit(1);
});
