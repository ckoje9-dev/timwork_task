import type { IssueStatus, IssuePriority, IssueType } from '@/types';

export const STATUS_LABEL: Record<IssueStatus, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  IN_REVIEW: 'IN REVIEW',
  DONE: 'DONE',
};

export const STATUS_CLASS: Record<IssueStatus, string> = {
  TODO: 'pill-todo',
  IN_PROGRESS: 'pill-in-progress',
  IN_REVIEW: 'pill-in-review',
  DONE: 'pill-done',
};

export const PRIORITY_LABEL: Record<IssuePriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

export const PRIORITY_CLASS: Record<IssuePriority, string> = {
  LOW: 'pill-low',
  MEDIUM: 'pill-medium',
  HIGH: 'pill-high',
  URGENT: 'pill-urgent',
};

/** 이슈 유형별 스타일 메타 (아이콘 제외 — 아이콘 크기는 컴포넌트가 결정) */
export const ISSUE_TYPE_META: Record<IssueType, { bg: string; color: string; label: string }> = {
  추가: { bg: 'bg-green-500/15', color: 'text-green-500', label: '추가' },
  수정: { bg: 'bg-blue-500/15', color: 'text-blue-500', label: '수정' },
  삭제: { bg: 'bg-red-500/15', color: 'text-red-500', label: '삭제' },
  간섭: { bg: 'bg-amber-500/15', color: 'text-amber-500', label: '간섭' },
};

export const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'TODO', label: 'TODO' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'IN_REVIEW', label: 'IN REVIEW' },
  { value: 'DONE', label: 'DONE' },
];

export const PRIORITY_OPTIONS_FORM: { value: IssuePriority; label: string }[] = [
  { value: 'URGENT', label: '긴급' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];
