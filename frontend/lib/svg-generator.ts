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
// Themes
// ─────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

interface ThemeColors {
  bg: string;
  empty: string;
  scale: [string, string, string, string]; // 1, 2–3, 4–6, 7+
  textPrimary: string;
  textSecondary: string;
}

const THEMES: Record<Theme, ThemeColors> = {
  light: {
    bg:            '#ffffff',
    empty:         '#ebedf0',
    scale:         ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
    textPrimary:   '#24292f',
    textSecondary: '#57606a',
  },
  dark: {
    bg:            '#0d1117',
    empty:         '#161b22',
    scale:         ['#0e4429', '#006d32', '#26a641', '#39d353'],
    textPrimary:   '#e6edf3',
    textSecondary: '#7d8590',
  },
};

function getColor(count: number, t: ThemeColors): string {
  if (count === 0) return t.empty;
  if (count === 1) return t.scale[0];
  if (count <= 3)  return t.scale[1];
  if (count <= 6)  return t.scale[2];
  return t.scale[3];
}

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;
const MONTH_GAP = 10;

const PAD_LEFT = 34;
const PAD_TOP = 40;
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
  year: number,
  t: ThemeColors,
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
        color: getColor(count, t),
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

function buildLegend(x: number, y: number, t: ThemeColors): string {
  const colors = [t.empty, ...t.scale];
  const parts: string[] = [
    `<text x="${x}" y="${y + CELL - 1}" font-size="9" fill="${t.textSecondary}" font-family="system-ui,-apple-system,sans-serif">Less</text>`
  ];

  let cx = x + 30;

  for (const color of colors) {
    parts.push(
      `<rect x="${cx}" y="${y}" width="${CELL}" height="${CELL}" rx="2" ry="2" fill="${color}" />`
    );
    cx += STEP;
  }

  parts.push(
    `<text x="${cx + 2}" y="${y + CELL - 1}" font-size="9" fill="${t.textSecondary}" font-family="system-ui,-apple-system,sans-serif">More</text>`
  );

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────
// Main SVG Generator
// ─────────────────────────────────────────────────────────────

export function generateSVG(heatmap: HeatmapData, theme: Theme = 'light'): string {
  const t = THEMES[theme];

  const {
    username,
    year,
    total_submissions,
    streak,
    longest_streak,
    data,
    avatar_url
  } = heatmap;

  const { cells, totalColumns, monthStartCols } = buildGrid(data, year, t);

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
    return `<text x="${midX}" y="${monthLabelY}" font-size="10" fill="${t.textSecondary}"
      text-anchor="middle"
      font-family="system-ui,-apple-system,sans-serif">
      ${MONTH_NAMES[i]}
    </text>`;
  }).join('\n');

  const dayLabels = DAY_LABELS.map((d, i) =>
    `<text x="${PAD_LEFT - 4}" y="${rowToY(i) + CELL - 1}" font-size="9"
      fill="${t.textSecondary}"
      text-anchor="end"
      font-family="system-ui,-apple-system,sans-serif">${d}</text>`
  ).join('\n');

  const statsY = SVG_HEIGHT + LEGEND_HEIGHT + 20;
  const mid = SVG_WIDTH / 2;

  const stats = `
    <text x="${PAD_LEFT}" y="${statsY}" font-size="11" fill="${t.textPrimary}"
      font-weight="600"
      font-family="system-ui,-apple-system,sans-serif">${escapeXml(username)}</text>

    <text x="${mid - 90}" y="${statsY}" font-size="11"
      fill="${t.textSecondary}"
      font-family="system-ui,-apple-system,sans-serif">
      ${total_submissions} submission${total_submissions !== 1 ? 's' : ''} in ${year}
    </text>

    <text x="${mid + 100}" y="${statsY}" font-size="11"
      fill="${t.textSecondary}"
      font-family="system-ui,-apple-system,sans-serif">
      Streak: ${streak} days
    </text>

    <text x="${SVG_WIDTH - PAD_RIGHT - 120}" y="${statsY}" font-size="11"
      fill="${t.textSecondary}"
      font-family="system-ui,-apple-system,sans-serif">
      Best: ${longest_streak} days
    </text>
  `;

  const legend = buildLegend(SVG_WIDTH - 178, SVG_HEIGHT + 8, t);

  // Exercism logo and profile picture
  const LOGO_SIZE = 24;
  const AVATAR_SIZE = 20;
  const header = `
    <!-- Exercism Logo -->
    <image href="https://assets.exercism.org/meta/logo-square.svg" 
      x="${PAD_LEFT}" y="12" 
      width="${LOGO_SIZE}" height="${LOGO_SIZE}" />
    <text x="${PAD_LEFT + LOGO_SIZE + 6}" y="${12 + LOGO_SIZE - 6}" 
      font-size="13" fill="${t.textPrimary}" font-weight="600"
      font-family="system-ui,-apple-system,sans-serif">Exercism</text>
  `;

  const avatarImage = avatar_url ? `
    <defs>
      <clipPath id="avatar-clip">
        <circle cx="${PAD_LEFT + AVATAR_SIZE / 2}" cy="${statsY - AVATAR_SIZE / 2 + 1}" r="${AVATAR_SIZE / 2}" />
      </clipPath>
    </defs>
    <image href="${escapeXml(avatar_url)}" 
      x="${PAD_LEFT}" y="${statsY - AVATAR_SIZE + 1}" 
      width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" 
      clip-path="url(#avatar-clip)" />
  ` : '';

  const statsWithAvatar = `
    <text x="${PAD_LEFT + (avatar_url ? AVATAR_SIZE + 6 : 0)}" y="${statsY}" font-size="11" fill="${t.textPrimary}"
      font-weight="600"
      font-family="system-ui,-apple-system,sans-serif">${escapeXml(username)}</text>

    <text x="${mid - 90}" y="${statsY}" font-size="11"
      fill="${t.textSecondary}"
      font-family="system-ui,-apple-system,sans-serif">
      ${total_submissions} submission${total_submissions !== 1 ? 's' : ''} in ${year}
    </text>

    <text x="${mid + 100}" y="${statsY}" font-size="11"
      fill="${t.textSecondary}"
      font-family="system-ui,-apple-system,sans-serif">
      Streak: ${streak} days
    </text>

    <text x="${SVG_WIDTH - PAD_RIGHT - 120}" y="${statsY}" font-size="11"
      fill="${t.textSecondary}"
      font-family="system-ui,-apple-system,sans-serif">
      Best: ${longest_streak} days
    </text>
  `;

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${SVG_WIDTH}"
    height="${totalHeight}"
    viewBox="0 0 ${SVG_WIDTH} ${totalHeight}"
    role="img"
  >

    <rect width="${SVG_WIDTH}" height="${totalHeight}" rx="8" ry="8" fill="${t.bg}" />

    ${header}
    ${avatarImage}
    ${monthLabels}
    ${dayLabels}
    ${rects}
    ${legend}
    ${statsWithAvatar}

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