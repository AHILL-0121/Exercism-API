import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllSolutions, solutionDate } from '@/lib/exercism';
import { generateMonthlySVG } from '@/lib/monthly-svg-generator';
import type { MonthlyHeatmapData } from '@/lib/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).end('Method not allowed');
    return;
  }

  const token    = process.env.EXERCISM_API_TOKEN;
  const username = process.env.EXERCISM_USERNAME;

  if (!token || !username) {
    res.status(500).setHeader('Content-Type', 'text/plain').end(
      'Server misconfiguration: EXERCISM_API_TOKEN and EXERCISM_USERNAME must be set.',
    );
    return;
  }

  const now = new Date();

  const yearParam  = req.query.year;
  const monthParam = req.query.month;

  const year = (typeof yearParam === 'string' && /^\d{4}$/.test(yearParam))
    ? parseInt(yearParam, 10)
    : now.getFullYear();

  const month = (typeof monthParam === 'string' && /^\d{1,2}$/.test(monthParam))
    ? Math.max(1, Math.min(12, parseInt(monthParam, 10)))
    : now.getMonth() + 1;

  const month0      = month - 1;
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const firstDow    = new Date(Date.UTC(year, month0, 1)).getUTCDay();

  try {
    const solutions = await fetchAllSolutions({ token, username, year });

    const submissionsByDay = Array<number>(daysInMonth).fill(0);

    for (const solution of solutions) {
      const d = solutionDate(solution);
      if (isNaN(d.getTime())) continue;
      if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month0) continue;
      const dayIdx = d.getUTCDate() - 1;
      if (dayIdx >= 0 && dayIdx < daysInMonth) {
        submissionsByDay[dayIdx]++;
      }
    }

    const total = submissionsByDay.reduce((a, b) => a + b, 0);

    const data: MonthlyHeatmapData = {
      username,
      year,
      month,
      month_name:         MONTH_NAMES[month0],
      days_in_month:      daysInMonth,
      first_day_of_week:  firstDow,
      total_this_month:   total,
      submissions_by_day: submissionsByDay,
    };

    const svg = generateMonthlySVG(data);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.status(200).end(svg);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[exercism-monthly-heatmap-svg]', message);

    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="40" viewBox="0 0 300 40">
  <rect width="300" height="40" rx="4" fill="#fff8c5"/>
  <text x="10" y="24" font-size="11" fill="#9a6700" font-family="system-ui,sans-serif">${escapeXml(message)}</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(502).end(errorSvg);
  }
}
