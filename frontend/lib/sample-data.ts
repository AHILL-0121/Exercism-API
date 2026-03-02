import type { HeatmapData, DayCount } from './types';

/**
 * Minimal seeded LCG PRNG so the sample heatmap looks the same every render.
 * Constants from Numerical Recipes.
 */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (1664525 * s + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Generate a realistic-looking sample HeatmapData for `year`.
 * Uses a deterministic PRNG so the output is stable across requests.
 */
export function generateSampleHeatmap(year: number): HeatmapData {
  const rng = seededRng(year * 31337);

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  // Build day list
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  // Generate counts with realistic bursts
  // ~60 % of days are inactive; active days cluster in streaks.
  let inStreak = false;
  let streakLeft = 0;
  let total = 0;
  let streak = 0;
  let longestStreak = 0;
  let currentStreakRun = 0;

  const today = new Date().toISOString().slice(0, 10);

  const data: DayCount[] = days.map((date) => {
    if (date > today) return { date, count: 0 };

    if (!inStreak) {
      // Start a new streak with 35 % probability
      if (rng() < 0.35) {
        inStreak = true;
        streakLeft = Math.floor(rng() * 14) + 1; // 1–14 day streak
      }
    }

    let count = 0;
    if (inStreak && streakLeft > 0) {
      // 1–7 submissions on active days, weighted low
      count = Math.max(1, Math.round(rng() * rng() * 8));
      streakLeft--;
      if (streakLeft === 0) inStreak = false;
    }

    total += count;
    if (count > 0) {
      currentStreakRun++;
      if (currentStreakRun > longestStreak) longestStreak = currentStreakRun;
    } else {
      currentStreakRun = 0;
    }

    return { date, count };
  });

  // Work out current (trailing) streak from the end
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].date > today) continue;
    if (data[i].count > 0) streak++;
    else break;
  }

  return {
    username: 'demo',
    year,
    total_submissions: total,
    streak,
    longest_streak: longestStreak,
    data,
  };
}
