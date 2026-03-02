import type { HeatmapData, DayCount } from './types';

/*
  IMPORTANT CHANGE:
  -----------------
  Each month now starts on a BRAND NEW COLUMN.

  This is no longer a "continuous Sunday-based GitHub grid".

  Instead:
  - Every month is rendered independently.
  - Column 0 of a month always contains the 1st of that month.
  - Months are visually separated with a fixed gap.
*/

// ─────────────────────────────────────────────────────────────
// Color scale
// ─────────────────────────────────────────────────────────────

const COLOR_EMPTY = '#ebedf0';
const COLOR_SCALE = [
  { min: 1, max: 1,        color: '#9be9a8' },
  { min: 2, max: 3,        color: '#40c463' },
  { min: 4, max: 6,        color: '#30a14e' },
  { min: 7, max: Infinity, color: '#216e39' },
];

function getColor(count: number): string {
  if (count === 0) return COLOR_EMPTY;
  for (const entry of COLOR_SCALE) {
    if (count >= entry.min && count <= entry.max) return entry.color;
  }
  return COLOR_SCALE[COLOR_SCALE.length - 1].color;
}

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;
const MONTH_GAP = 10;

const PAD_LEFT = 34;
const PAD_TOP = 10;
const PAD_RIGHT = 14;
const PAD_BOTTOM = 22;

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function rowToY(row: number): number {
  return PAD_TOP + row * STEP;
}

function colToX(col: number): number {
  return PAD_LEFT + col * STEP;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// ─────────────────────────────────────────────────────────────
// Build Grid (Month-Reset Based)
// ─────────────────────────────────────────────────────────────

interface GridCell {
  x: number;
  y: number;
  color: string;
  count: number;
  date: string;
}

function buildGrid(
  data: DayCount[],
  year: number
): { cells: GridCell[]; totalColumns: number; monthStartCols: number[] } {

  const countMap = new Map<string, number>();
  for (const d of data) countMap.set(d.date, d.count);

  const cells: GridCell[] = [];
  const monthStartCols: number[] = [];

  let globalCol = 0;

  for (let month = 0; month < 12; month++) {
    monthStartCols.push(globalCol);

    const firstDay = new Date(Date.UTC(year, month, 1));
    const firstDow = firstDay.getUTCDay();
    const totalDays = daysInMonth(year, month);

    let col = globalCol;
    let row = firstDow;

    for (let day = 1; day <= totalDays; day++) {
      const dateStr =
        `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

      const count = countMap.get(dateStr) ?? 0;

      cells.push({
        x: colToX(col),
        y: rowToY(row),
        color: getColor(count),
        count,
        date: dateStr
      });

      row++;
      if (row === 7) {
        row = 0;
        col++;
      }
    }

    // Move to next column for next month (force separation)
    globalCol = col + 1;
  }

  return { cells, totalColumns: globalCol, monthStartCols };
}

// ─────────────────────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────────────────────

function buildLegend(x: number, y: number): string {
  const colors = [COLOR_EMPTY, ...COLOR_SCALE.map(s => s.color)];
  const parts: string[] = [
    `<text x="${x}" y="${y + CELL - 1}" font-size="9" fill="#57606a" font-family="system-ui,-apple-system,sans-serif">Less</text>`
  ];

  let cx = x + 30;

  for (const color of colors) {
    parts.push(
      `<rect x="${cx}" y="${y}" width="${CELL}" height="${CELL}" rx="2" ry="2" fill="${color}" />`
    );
    cx += STEP;
  }

  parts.push(
    `<text x="${cx + 2}" y="${y + CELL - 1}" font-size="9" fill="#57606a" font-family="system-ui,-apple-system,sans-serif">More</text>`
  );

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────
// Main SVG Generator
// ─────────────────────────────────────────────────────────────

export function generateSVG(heatmap: HeatmapData): string {

  const {
    username,
    year,
    total_submissions,
    streak,
    longest_streak,
    data
  } = heatmap;

  const { cells, totalColumns, monthStartCols } = buildGrid(data, year);

  const SVG_WIDTH =
    PAD_LEFT +
    totalColumns * STEP +
    PAD_RIGHT;

  const SVG_HEIGHT =
    PAD_TOP +
    7 * STEP +
    PAD_BOTTOM;

  const LEGEND_HEIGHT = 28;
  const STAT_HEIGHT = 34;
  const totalHeight = SVG_HEIGHT + LEGEND_HEIGHT + STAT_HEIGHT;

  const rects = cells.map(c =>
    `<rect x="${c.x}" y="${c.y}" width="${CELL}" height="${CELL}" rx="2" ry="2" fill="${c.color}">
      <title>${c.date}: ${c.count} submission${c.count !== 1 ? 's' : ''}</title>
    </rect>`
  ).join('\n');

  const monthLabelY = PAD_TOP + 7 * STEP + 14;

  const monthLabels = monthStartCols.map((startCol, i) => {
    const nextStartCol = i + 1 < monthStartCols.length ? monthStartCols[i + 1] : totalColumns;
    const monthCols = nextStartCol - startCol - 1; // subtract the separator gap column
    const midX = colToX(startCol) + (monthCols * STEP - GAP) / 2;
    return `<text x="${midX}" y="${monthLabelY}" font-size="10" fill="#57606a"
      text-anchor="middle"
      font-family="system-ui,-apple-system,sans-serif">
      ${MONTH_NAMES[i]}
    </text>`;
  }).join('\n');

  const dayLabels = DAY_LABELS.map((d, i) =>
    `<text x="${PAD_LEFT - 4}" y="${rowToY(i) + CELL - 1}" font-size="9"
      fill="#57606a"
      text-anchor="end"
      font-family="system-ui,-apple-system,sans-serif">${d}</text>`
  ).join('\n');

  const statsY = SVG_HEIGHT + LEGEND_HEIGHT + 20;
  const mid = SVG_WIDTH / 2;

  const stats = `
    <text x="${PAD_LEFT}" y="${statsY}" font-size="11" fill="#24292f"
      font-weight="600"
      font-family="system-ui,-apple-system,sans-serif">${escapeXml(username)}</text>

    <text x="${mid - 90}" y="${statsY}" font-size="11"
      fill="#57606a"
      font-family="system-ui,-apple-system,sans-serif">
      ${total_submissions} submission${total_submissions !== 1 ? 's' : ''} in ${year}
    </text>

    <text x="${mid + 100}" y="${statsY}" font-size="11"
      fill="#57606a"
      font-family="system-ui,-apple-system,sans-serif">
      Streak: ${streak} days
    </text>

    <text x="${SVG_WIDTH - PAD_RIGHT - 120}" y="${statsY}" font-size="11"
      fill="#57606a"
      font-family="system-ui,-apple-system,sans-serif">
      Best: ${longest_streak} days
    </text>
  `;

  const legend = buildLegend(SVG_WIDTH - 178, SVG_HEIGHT + 8);

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${SVG_WIDTH}"
    height="${totalHeight}"
    viewBox="0 0 ${SVG_WIDTH} ${totalHeight}"
    role="img"
  >

    <rect width="${SVG_WIDTH}" height="${totalHeight}" rx="8" ry="8" fill="#ffffff" />

    ${monthLabels}
    ${dayLabels}
    ${rects}
    ${legend}
    ${stats}

  </svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}