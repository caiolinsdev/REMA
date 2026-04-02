export type { ApiServiceStatus, HealthcheckResponse, ApiInfoResponse } from "./legacy";

export type { DomainLifecycleState } from "./common/states";

export type { Role, AuthUser } from "./auth/types";
export type {
  LoginRequest,
  AuthSessionResponse,
  MeResponse,
  AuthErrorCode,
  AuthErrorBody,
} from "./auth/session";

export type {
  ActivityKind,
  ActivityStatus,
  QuestionType,
  QuestionOption,
  QuestionOptionInput,
  QuestionDetail,
  QuestionInput,
  ActivitySummary,
  ActivityDetail,
  UpsertActivityRequest,
  AddQuestionRequest,
  ActivityValidationIssueCode,
  ActivityValidationIssue,
  ActivityValidationSummary,
  SubmissionStatus,
  SubmissionSummary,
  SubmissionAnswer,
  SubmissionAnswerInput,
  SubmissionFile,
  SubmissionFileInput,
  SubmissionDetail,
  UpsertSubmissionRequest,
  SubmissionListItem,
  ReviewPayload,
} from "./activities/types";

export type {
  ContentSummary,
  ContentDetail,
  UpsertContentRequest,
} from "./contents/types";

export type {
  CalendarEventType,
  CalendarEventSummary,
  PersonalCalendarNote,
  UpsertCalendarEventRequest,
  UpsertPersonalCalendarNoteRequest,
} from "./calendar/types";

export type {
  CommunityAudience,
  CommunityPostSummary,
  CommunityPostDetail,
  CreateCommunityPostRequest,
  CommunityModerationStatus,
  ModerateCommunityPostRequest,
} from "./community/types";

export type { GameSummary } from "./games/types";

export type {
  ProfileResponse,
  UpdateProfileRequest,
  UpdateAvatarRequest,
} from "./profile/types";
