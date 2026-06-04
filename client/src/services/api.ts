const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request<{ username: string }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getDashboard: () => request<Record<string, unknown>>('/analytics/dashboard'),
  getSectionAnalytics: () => request<unknown[]>('/analytics/sections'),
  getTopicAnalytics: (sectionId?: number) =>
    request<unknown[]>(`/analytics/topics${sectionId ? `?section_id=${sectionId}` : ''}`),
  getTrends: () => request<unknown[]>('/analytics/trends'),

  getSections: () => request<Section[]>('/sections'),
  createSection: (section_name: string) =>
    request<Section>('/sections', { method: 'POST', body: JSON.stringify({ section_name }) }),
  updateSection: (id: number, section_name: string) =>
    request<Section>(`/sections/${id}`, { method: 'PUT', body: JSON.stringify({ section_name }) }),
  deleteSection: (id: number) => request(`/sections/${id}`, { method: 'DELETE' }),

  getTopics: (sectionId?: number) =>
    request<Topic[]>(`/topics${sectionId ? `?section_id=${sectionId}` : ''}`),
  createTopic: (section_id: number, topic_name: string) =>
    request<Topic>('/topics', { method: 'POST', body: JSON.stringify({ section_id, topic_name }) }),
  updateTopic: (id: number, topic_name: string) =>
    request<Topic>(`/topics/${id}`, { method: 'PUT', body: JSON.stringify({ topic_name }) }),
  deleteTopic: (id: number) => request(`/topics/${id}`, { method: 'DELETE' }),

  getQuestions: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== '' && v !== undefined) q.set(k, String(v));
      });
    }
    return request<Question[]>(`/questions?${q}`);
  },
  createQuestion: (data: unknown) =>
    request<Question>('/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id: number, data: unknown) =>
    request<Question>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id: number) => request(`/questions/${id}`, { method: 'DELETE' }),
  duplicateQuestion: (id: number) =>
    request<Question>(`/questions/${id}/duplicate`, { method: 'POST' }),
  bulkQuestions: (data: unknown) =>
    request('/questions/bulk', { method: 'POST', body: JSON.stringify(data) }),

  generateQuiz: (data: unknown) =>
    request<{ questions: QuizQuestion[]; total: number }>('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitQuiz: (data: unknown) =>
    request<QuizResult>('/quiz/submit', { method: 'POST', body: JSON.stringify(data) }),
  getQuizResults: () => request<QuizResultSummary[]>('/quiz/results'),
  getQuizResult: (id: number) => request(`/quiz/results/${id}`),

  getBookmarks: () => request<unknown[]>('/bookmarks'),
  addBookmark: (questionId: number) =>
    request(`/bookmarks/${questionId}`, { method: 'POST' }),
  removeBookmark: (questionId: number) =>
    request(`/bookmarks/${questionId}`, { method: 'DELETE' }),

  getRevisionQuestions: (type: string, limit?: number) =>
    request<{ questions: QuizQuestion[]; type: string }>(
      `/revision/questions?type=${type}&limit=${limit || 20}`
    ),
  completeRevision: (data: unknown) =>
    request('/revision/complete', { method: 'POST', body: JSON.stringify(data) }),

  backupDb: () => request<{ filename: string }>('/settings/backup', { method: 'POST' }),
  exportQuestionsUrl: (format: string) => `/api/settings/export/questions?format=${format}`,
  exportDbUrl: () => '/api/settings/export/db',
};

export interface Section {
  id: number;
  section_name: string;
  topic_count?: number;
  question_count?: number;
}

export interface Topic {
  id: number;
  section_id: number;
  topic_name: string;
  section_name?: string;
  question_count?: number;
}

export interface Question {
  id: number;
  topic_id: number;
  question_text: string;
  correct_answer: string;
  difficulty_level: string;
  tags: string;
  section_name?: string;
  topic_name?: string;
  is_bookmarked?: number;
  options?: { id: number; option_text: string; is_correct: number }[];
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  correct_answer?: string;
  options: { id: number; option_text: string }[];
  section_name?: string;
  topic_name?: string;
}

export interface QuizResult {
  quiz_result_id: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  score_percentage: number;
}

export interface QuizResultSummary {
  id: number;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  completed_at: string;
}
