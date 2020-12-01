/* eslint-disable camelcase */
export interface Author {
  state: string;
  id: number;
  web_url: string;
  name: string;
  avatar_url?: any;
  username: string;
}

export interface Milestone {
  project_id: number;
  description: string;
  state: string;
  due_date?: any;
  iid: number;
  created_at: Date;
  title: string;
  id: number;
  updated_at: Date;
}

export interface Assignee {
  state: string;
  id: number;
  name: string;
  web_url: string;
  avatar_url?: any;
  username: string;
}

export interface References {
  short: string;
  relative: string;
  full: string;
}

export interface TimeStats {
  time_estimate: number;
  total_time_spent: number;
  human_time_estimate?: any;
  human_total_time_spent?: any;
}

export interface Links {
  self: string;
  notes: string;
  award_emoji: string;
  project: string;
}

export interface TaskCompletionStatus {
  count: number;
  completed_count: number;
}

export interface Issue {
  state: string;
  description: string;
  author: Author;
  milestone: Milestone;
  project_id: number;
  assignees: Assignee[];
  assignee: Assignee;
  updated_at: Date;
  closed_at?: any;
  closed_by?: any;
  id: number;
  title: string;
  created_at: Date;
  moved_to_id?: any;
  iid: number;
  labels: string[];
  upvotes: number;
  downvotes: number;
  merge_requests_count: number;
  user_notes_count: number;
  due_date: string;
  web_url: string;
  references: References;
  time_stats: TimeStats;
  has_tasks: boolean;
  task_status: string;
  confidential: boolean;
  discussion_locked: boolean;
  _links: Links;
  task_completion_status: TaskCompletionStatus;
}

export interface GroupSamlIdentity {
  extern_uid: string;
  provider: string;
  saml_provider_id: number;
}

export interface Member {
  id: number;
  username: string;
  name: string;
  state: string;
  avatar_url: string;
  web_url: string;
  expires_at: Date;
  access_level: number;
  email: string;
  group_saml_identity?: GroupSamlIdentity;
}
