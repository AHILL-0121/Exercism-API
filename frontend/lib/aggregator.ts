import type { ExercismSolution, DayCount, HeatmapData } from './types';
import { solutionDate } from './exercism';

/**
 * Convert a Date object to YYYY-MM-DD string (UTC).
 */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Build a map of date string → submission count from a list of solutions.
 */
function buildCountMap(solutions: ExercismSolution[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const solution of solutions) {
    const d = solutionDate(solution);
    if (isNaN(d.getTime())) continue;
    const dateStr = toDateString(d);
    map.set(dateStr, (map.get(dateStr) ?? 0) + 1);
  }
  return map;
}

/**
 * Generate all calendar dates for a given year as YYYY-MM-DD strings.
 */
function getDatesForYear(year: number): string[] {
  const dates: string[] = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  const current = new Date(start);
  while (current <= end) {
    dates.push(toDateString(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Calculate current and longest streak from a count map and ordered date list.
 * A streak is broken when a day has 0 submissions.
 */
function calculateStreaks(
  dates: string[],
  countMap: Map<string, number>,
): { streak: number; longestStreak: number } {
  const today = toDateString(new Date());

  let streak = 0;
  let longestStreak = 0;
  let current = 0;

  // Walk forward to calculate longest streak
  for (const date of dates) {
    if ((countMap.get(date) ?? 0) > 0) {
      current++;
      if (current > longestStreak) longestStreak = current;
    } else {
      current = 0;
    }
  }

  // Walk backward from today to calculate current streak
  const reversedDates = [...dates].reverse();
  let counting = false;
  for (const date of reversedDates) {
    if (date > today) continue; // skip future dates
    if ((countMap.get(date) ?? 0) > 0) {
      counting = true;
      streak++;
    } else if (counting) {
      // Allow a gap of exactly today (not yet submitted today)
      if (date === today) continue;
      break;
    }
  }

  return { streak, longestStreak };
}

/**
 * Aggregate solutions into a full HeatmapData object for a given year.
 */
export function aggregateSolutions(
  solutions: ExercismSolution[],
  username: string,
  year: number,
  avatarUrl?: string,
): HeatmapData {
  const countMap = buildCountMap(solutions);
  const dates = getDatesForYear(year);

  const data: DayCount[] = dates.map((date) => ({
    date,
    count: countMap.get(date) ?? 0,
  }));

  const totalSubmissions = solutions.length;
  const { streak, longestStreak } = calculateStreaks(dates, countMap);

  return {
    username,
    year,
    total_submissions: totalSubmissions,
    streak,
    longest_streak: longestStreak,
    data,
    avatar_url: avatarUrl,
  };
}
