import type { MonthlyHeatmapData } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL      = 12;          // px — matches Tailwind h-3/w-3
const GAP       = 2;           // px between cells
const STEP      = CELL + GAP;  // 14px
const DOW_W     = 14;          // width reserved for day-of-week labels
const PAD_TOP   = 18;          // room for month name
const PAD_RIGHT = 8;

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Exercism / GitHub green scale (matches the annual heatmap)
function getColor(count: number | null): string {
  if (count === null) return 'none';   // empty cell (before 1st / after last)
  if (count === 0)   return '#ebedf0';
  if (count === 1)   return '#9be9a8';
  if (count <= 3)    return '#40c463';
  if (count <= 6)    return '#30a14e';
  return '#216e39';
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

interface Cell {
  row: number;   // 0 = Sunday … 6 = Saturday
  col: number;   // week index (0-based)
  day: number | null;
  count: number | null;
}

function buildGrid(data: MonthlyHeatmapData): { cells: Cell[]; numWeeks: number } {
  const { days_in_month, first_day_of_week, submissions_by_day } = data;
  const numWeeks = Math.ceil((days_in_month + first_day_of_week) / 7);

  const cells: Cell[] = [];
  let day = 1;

  for (let col = 0; col < numWeeks; col++) {
    for (let row = 0; row < 7; row++) {
      const isBeforeStart = col === 0 && row < first_day_of_week;
      const isAfterEnd    = day > days_in_month;

      if (isBeforeStart || isAfterEnd) {
        cells.push({ row, col, day: null, count: null });
      } else {
        cells.push({ row, col, day, count: submissions_by_day[day - 1] ?? 0 });
        day++;
      }
    }
  }

  return { cells, numWeeks };
}

// ─── SVG generator ───────────────────────────────────────────────────────────

export function generateMonthlySVG(data: MonthlyHeatmapData): string {
  const { cells, numWeeks } = buildGrid(data);

  const svgW = DOW_W + numWeeks * STEP + PAD_RIGHT;
  const svgH = PAD_TOP + 7 * STEP + 4;    // +4 bottom pad

  const font = "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

  // ── Month label
  const monthLabel = `<text
    x="${DOW_W + (numWeeks * STEP) / 2}"
    y="12"
    text-anchor="middle"
    font-size="10"
    font-weight="600"
    fill="#57606a"
    font-family="${font}"
  >${data.month_name} ${data.year}</text>`;

  // ── Day-of-week labels
  const dowLabels = DOW_LABELS.map((label, i) => {
    const y = PAD_TOP + i * STEP + CELL - 2;
    return `<text
      x="${DOW_W - 3}"
      y="${y}"
      text-anchor="end"
      font-size="8"
      fill="#8c959f"
      font-family="${font}"
    >${label}</text>`;
  }).join('\n');

  // ── Day cells
  const rects = cells.map(({ row, col, day, count }) => {
    const x = DOW_W + col * STEP;
    const y = PAD_TOP + row * STEP;
    const fill = getColor(count);

    if (fill === 'none') {
      // Invisible placeholder — keeps grid spacing intact
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="none"/>`;
    }

    const title = day !== null
      ? `${data.year}-${String(data.month).padStart(2, '0')}-${String(day).padStart(2, '0')}: ${count} submission${count !== 1 ? 's' : ''}`
      : '';

    return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}">
      <title>${title}</title>
    </rect>`;
  }).join('\n');

  // ── Stats line below grid
  const statsY = PAD_TOP + 7 * STEP + 14;
  const stats  = `<text
    x="${DOW_W}"
    y="${statsY}"
    font-size="9"
    fill="#57606a"
    font-family="${font}"
  >${data.total_this_month} submission${data.total_this_month !== 1 ? 's' : ''} this month</text>`;

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${svgW}"
  height="${svgH + 14}"
  viewBox="0 0 ${svgW} ${svgH + 14}"
  role="img"
  aria-label="Exercism monthly heatmap for ${data.month_name} ${data.year}"
>
${monthLabel}
${dowLabels}
${rects}
${stats}
</svg>`;
}
