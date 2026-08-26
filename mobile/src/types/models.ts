export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export interface Avatar {
  public_id?: string;
  url?: string;
}

export interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface Experience {
  company?: string;
  position?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export type UserRole = 'user' | 'mentor' | 'admin';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  avatar?: Avatar | null;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: Education[];
  experience?: Experience[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  role: UserRole;
  isVerified?: boolean;
  isMentorApproved?: boolean;
  reputation?: number;
  isActive?: boolean;
  ideasCreated?: string[];
  projectsJoined?: string[];
}

export interface AuthPayload {
  user: User;
  token: string;
  refreshToken: string;
}

export type IdeaCategory =
  | 'technology'
  | 'business'
  | 'healthcare'
  | 'education'
  | 'environment'
  | 'social'
  | 'entertainment'
  | 'finance'
  | 'other';

export type IdeaStatus =
  | 'draft'
  | 'open'
  | 'in-progress'
  | 'completed'
  | 'archived'
  | 'pending-approval'
  | 'rejected';

export type IdeaVisibility = 'public' | 'private' | 'invite-only';

export type IdeaSort = 'newest' | 'oldest' | 'popular' | 'trending';

export type IdeaAuthor = Pick<User, '_id' | 'id' | 'name' | 'avatar'>;

export interface MentorReview {
  mentor: IdeaAuthor | string;
  review: string;
  rating: number;
  createdAt?: string;
}

export interface IdeaTeamMember {
  user: IdeaAuthor | string;
  role?: string;
  joinedAt?: string;
}

export interface IdeaAiAnalysis {
  suggestions?: string[];
  challenges?: string[];
  recommendedTechnologies?: string[];
  analyzedAt?: string;
}

export interface IdeaImage {
  public_id?: string;
  url?: string;
}

export interface Idea {
  _id: string;
  title: string;
  description: string;
  author: IdeaAuthor | string;
  category: IdeaCategory;
  tags: string[];
  requiredSkills: string[];
  status: IdeaStatus;
  visibility: IdeaVisibility;
  likes: string[];
  bookmarks: string[];
  commentsCount: number;
  views: number;
  images?: IdeaImage[];
  aiAnalysis?: IdeaAiAnalysis | null;
  mentorReviews?: MentorReview[];
  team?: IdeaTeamMember[];
  convertedToProject?: string | null;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaComment {
  _id: string;
  content: string;
  author: IdeaAuthor;
  parent?: string | null;
  replies?: (IdeaComment | string)[];
  likes: string[];
  isEdited?: boolean;
  editedAt?: string;
  createdAt: string;
}

export type ProjectStatus =
  | 'planning'
  | 'in-progress'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'pending-approval'
  | 'rejected';

export type ProjectVisibility = 'public' | 'private';

export type ProjectMemberRole =
  | 'lead'
  | 'developer'
  | 'designer'
  | 'researcher'
  | 'mentor';

export interface ProjectMember {
  user: IdeaAuthor | string;
  role: ProjectMemberRole;
  status?: string;
  joinedAt?: string;
}

export interface Milestone {
  _id?: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  completed: boolean;
  completedAt?: string | null;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  idea?: { _id: string; title: string } | string | null;
  owner: IdeaAuthor | string;
  members: ProjectMember[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  technologies: string[];
  repository?: string;
  demoUrl?: string;
  deadline?: string | null;
  progress: number;
  tasks: (ProjectTask | string)[];
  milestones: Milestone[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequest {
  _id: string;
  sender: IdeaAuthor | string | null;
  message?: string;
  status: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  _id: string;
  title: string;
  description?: string;
  project: { _id: string; title: string; status?: string } | string;
  assignedTo?: IdeaAuthor | string | null;
  createdBy?: IdeaAuthor | string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  labels?: string[];
  createdAt: string;
}

export interface MessageAttachment {
  public_id?: string;
  url: string;
  name?: string;
  type?: string;
}

export interface MessageReaction {
  user: string;
  emoji: string;
}

export interface ChatMessage {
  _id: string;
  chat: string;
  sender: IdeaAuthor | string;
  content?: string;
  attachments?: MessageAttachment[];
  replyTo?: ChatMessage | string | null;
  reactions: MessageReaction[];
  readBy: { user: string; readAt?: string }[];
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedFor?: string[];
  createdAt: string;
}

export interface Chat {
  _id: string;
  participants: (IdeaAuthor | string)[];
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar?: Avatar | null;
  admins?: (IdeaAuthor | string)[];
  creator?: IdeaAuthor | string | null;
  lastMessage?: ChatMessage | string | null;
  relatedProject?: { _id: string; title: string } | string | null;
  createdAt: string;
}
