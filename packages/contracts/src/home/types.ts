import type { SubmissionStatus } from "../activities/types";
import type { CalendarEventType, PersonalCalendarNote } from "../calendar/types";
import type { CommunityPostSummary } from "../community/types";
import type { ContentSummary } from "../contents/types";

export type StudentHomeUpcomingItemSource = "calendar_event" | "personal_note";

export interface StudentHomeUpcomingItem {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  source: StudentHomeUpcomingItemSource;
  eventType?: CalendarEventType | null;
  sourceActivityId?: string | null;
}

export interface StudentHomeSummary {
  recentPosts: CommunityPostSummary[];
  upcomingItems: StudentHomeUpcomingItem[];
}

export interface TeacherHomePendingReview {
  submissionId: string;
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  submittedAt: string | null;
  status: SubmissionStatus;
}

export interface TeacherHomeSummary {
  recentContents: ContentSummary[];
  pendingReviews: TeacherHomePendingReview[];
}

export type StudentHomeRecentPost = CommunityPostSummary;
export type TeacherHomeRecentContent = ContentSummary;
export type StudentHomePersonalNote = PersonalCalendarNote;
