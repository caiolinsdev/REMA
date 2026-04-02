import type {
  ActivityDetail,
  ActivitySummary,
  AuthSessionResponse,
  CalendarEventSummary,
  CommunityPostDetail,
  CommunityPostSummary,
  ContentDetail,
  ContentSummary,
  CreateCommunityPostRequest,
  GameDetail,
  GameSessionSummary,
  GameSummary,
  LoginRequest,
  MeResponse,
  ModerateCommunityPostRequest,
  PersonalCalendarNote,
  RegisterGameSessionRequest,
  ReviewPayload,
  ProfileResponse,
  SubmissionDetail,
  SubmissionListItem,
  UpsertCalendarEventRequest,
  UpsertContentRequest,
  UpsertPersonalCalendarNoteRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  UpsertSubmissionRequest,
  UpsertActivityRequest,
} from "@rema/contracts";

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
}

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}

async function authorizedRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) {
    const error = new Error(getErrorMessage(data, "Falha na requisicao")) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }
  return data as T;
}

export async function apiLogin(body: LoginRequest): Promise<AuthSessionResponse> {
  const res = await fetch(`${getApiBase()}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data, "Falha no login"));
  }
  return data as AuthSessionResponse;
}

export async function apiMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${getApiBase()}/auth/me/`, {
    headers: { Authorization: `Token ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new Error("session_expired");
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data, "Falha ao carregar sessao"));
  }
  return data as MeResponse;
}

export async function apiLogout(token: string): Promise<void> {
  await fetch(`${getApiBase()}/auth/logout/`, {
    method: "POST",
    headers: { Authorization: `Token ${token}` },
  });
}

export function apiActivities(token: string): Promise<ActivitySummary[]> {
  return authorizedRequest<ActivitySummary[]>(token, "/activities/");
}

export function apiActivityDetail(token: string, id: number | string): Promise<ActivityDetail> {
  return authorizedRequest<ActivityDetail>(token, `/activities/${id}/`);
}

export function apiCreateActivity(
  token: string,
  body: UpsertActivityRequest,
): Promise<ActivityDetail> {
  return authorizedRequest<ActivityDetail>(token, "/activities/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiUpdateActivity(
  token: string,
  id: number | string,
  body: UpsertActivityRequest,
): Promise<ActivityDetail> {
  return authorizedRequest<ActivityDetail>(token, `/activities/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiPublishActivity(token: string, id: number | string): Promise<ActivityDetail> {
  return authorizedRequest<ActivityDetail>(token, `/activities/${id}/publish/`, {
    method: "POST",
  });
}

export function apiCurrentSubmission(
  token: string,
  activityId: number | string,
): Promise<SubmissionDetail> {
  return authorizedRequest<SubmissionDetail>(
    token,
    `/activities/${activityId}/submissions/current/`,
  );
}

export function apiSaveSubmission(
  token: string,
  activityId: number | string,
  body: UpsertSubmissionRequest,
): Promise<SubmissionDetail> {
  return authorizedRequest<SubmissionDetail>(token, `/activities/${activityId}/submissions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiActivitySubmissions(
  token: string,
  activityId: number | string,
): Promise<SubmissionListItem[]> {
  return authorizedRequest<SubmissionListItem[]>(
    token,
    `/activities/${activityId}/submissions/`,
  );
}

export function apiSubmissionDetail(
  token: string,
  submissionId: number | string,
): Promise<SubmissionDetail> {
  return authorizedRequest<SubmissionDetail>(token, `/submissions/${submissionId}/`);
}

export function apiConfirmSubmission(
  token: string,
  submissionId: number | string,
): Promise<SubmissionDetail> {
  return authorizedRequest<SubmissionDetail>(token, `/submissions/${submissionId}/confirm/`, {
    method: "POST",
  });
}

export function apiReviewSubmission(
  token: string,
  submissionId: number | string,
  body: ReviewPayload,
): Promise<SubmissionDetail> {
  return authorizedRequest<SubmissionDetail>(token, `/submissions/${submissionId}/review/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiContents(token: string): Promise<ContentSummary[]> {
  return authorizedRequest<ContentSummary[]>(token, "/contents/");
}

export function apiContentDetail(
  token: string,
  contentId: number | string,
): Promise<ContentDetail> {
  return authorizedRequest<ContentDetail>(token, `/contents/${contentId}/`);
}

export function apiCreateContent(
  token: string,
  body: UpsertContentRequest,
): Promise<ContentDetail> {
  return authorizedRequest<ContentDetail>(token, "/contents/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiUpdateContent(
  token: string,
  contentId: number | string,
  body: Partial<UpsertContentRequest> & { status?: string },
): Promise<ContentDetail> {
  return authorizedRequest<ContentDetail>(token, `/contents/${contentId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDeleteContent(
  token: string,
  contentId: number | string,
): Promise<void> {
  await authorizedRequest<Record<string, never>>(
    token,
    `/contents/${contentId}/`,
    { method: "DELETE" },
  );
}

export function apiCalendarEvents(token: string): Promise<CalendarEventSummary[]> {
  return authorizedRequest<CalendarEventSummary[]>(token, "/calendar/events/");
}

export function apiCreateCalendarEvent(
  token: string,
  body: UpsertCalendarEventRequest,
): Promise<CalendarEventSummary> {
  return authorizedRequest<CalendarEventSummary>(token, "/calendar/events/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiCalendarNotes(token: string): Promise<PersonalCalendarNote[]> {
  return authorizedRequest<PersonalCalendarNote[]>(token, "/calendar/notes/");
}

export function apiCreateCalendarNote(
  token: string,
  body: UpsertPersonalCalendarNoteRequest,
): Promise<PersonalCalendarNote> {
  return authorizedRequest<PersonalCalendarNote>(token, "/calendar/notes/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiProfile(token: string): Promise<ProfileResponse> {
  return authorizedRequest<ProfileResponse>(token, "/profile/");
}

export function apiUpdateProfile(
  token: string,
  body: UpdateProfileRequest,
): Promise<ProfileResponse> {
  return authorizedRequest<ProfileResponse>(token, "/profile/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiUpdateAvatar(
  token: string,
  body: UpdateAvatarRequest,
): Promise<ProfileResponse> {
  return authorizedRequest<ProfileResponse>(token, "/profile/avatar/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiCommunityPosts(
  token: string,
  query?: string,
): Promise<CommunityPostSummary[]> {
  return authorizedRequest<CommunityPostSummary[]>(
    token,
    `/community/posts/${query ? `?${query}` : ""}`,
  );
}

export function apiCommunityPostDetail(
  token: string,
  postId: number | string,
): Promise<CommunityPostDetail> {
  return authorizedRequest<CommunityPostDetail>(token, `/community/posts/${postId}/`);
}

export function apiCreateCommunityPost(
  token: string,
  body: CreateCommunityPostRequest,
): Promise<CommunityPostDetail> {
  return authorizedRequest<CommunityPostDetail>(token, "/community/posts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiApproveCommunityPost(
  token: string,
  postId: number | string,
  body: ModerateCommunityPostRequest,
): Promise<CommunityPostDetail> {
  return authorizedRequest<CommunityPostDetail>(
    token,
    `/community/posts/${postId}/approve/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export function apiRejectCommunityPost(
  token: string,
  postId: number | string,
  body: ModerateCommunityPostRequest,
): Promise<CommunityPostDetail> {
  return authorizedRequest<CommunityPostDetail>(
    token,
    `/community/posts/${postId}/reject/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export function apiGames(token: string): Promise<GameSummary[]> {
  return authorizedRequest<GameSummary[]>(token, "/games/");
}

export function apiGameDetail(
  token: string,
  gameId: number | string,
): Promise<GameDetail> {
  return authorizedRequest<GameDetail>(token, `/games/${gameId}/`);
}

export function apiRegisterGameSession(
  token: string,
  gameId: number | string,
  body: RegisterGameSessionRequest,
): Promise<GameSessionSummary> {
  return authorizedRequest<GameSessionSummary>(token, `/games/${gameId}/sessions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiGameSessions(token: string): Promise<GameSessionSummary[]> {
  return authorizedRequest<GameSessionSummary[]>(token, "/games/sessions/");
}
