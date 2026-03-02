export interface ExercismSolution {
  uuid: string;
  /** Present in some API versions; may be absent. */
  submitted_at?: string | null;
  /** Set when the solution was marked complete. */
  completed_at?: string | null;
  /** Set when the last iteration was submitted. */
  last_iterated_at?: string | null;
  /** Always present — last modification timestamp. */
  updated_at: string;
  exercise: {
    slug: string;
    title: string;
  };
  track: {
    slug: string;
    title: string;
  };
  status: string;
}

export interface ExercismApiResponse {
  results: ExercismSolution[];
  meta: {
    current_page: number;
    total_count: number;
    total_pages: number;
  };
}

export interface DayCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface HeatmapData {
  username: string;
  year: number;
  total_submissions: number;
  streak: number;
  longest_streak: number;
  data: DayCount[];
}

export interface FetchOptions {
  username: string;
  token: string;
  year?: number;
}

export interface MonthlyHeatmapData {
  username: string;
  year: number;
  /** 1–12 */
  month: number;
  month_name: string;
  days_in_month: number;
  /** 0 = Sunday … 6 = Saturday */
  first_day_of_week: number;
  total_this_month: number;
  /**
   * Submission counts indexed by day-of-month (0-based).
   * submissions_by_day[0] = count for the 1st, etc.
   * Length equals days_in_month.
   */
  submissions_by_day: number[];
}

export interface BadgeData {
  uuid: string;
  name: string;
  description: string;
  icon_name: string;
  /** Full fingerprinted URL, e.g. https://assets.exercism.org/assets/icons/whatever-abc123.svg */
  image_url: string;
  rarity: string;
  unlocked_at: string;
}

export interface ContributionCategory {
  label: string;
  detail: string;
  rep: number;
}

export interface ProfileData {
  handle: string;
  display_name: string;
  location: string;
  pronouns: string;
  joined: string;
  avatar_url: string;
  reputation: number;
  badge_count: number;
  badges: BadgeData[];
  contributions: ContributionCategory[];
}
