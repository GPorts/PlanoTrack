export type StudyMode = "ai";

export type SubjectInput = {
  name: string;
  questions?: number;
  weight?: number;
  topics: string[];
};

export type RoutineInput = {
  examName: string;
  examDate: string;
  hoursPerDay: number;
  studyDays: string[];
  preferredBlocks: string;
};

export type StudyBlock = {
  period: "Manha" | "Tarde" | "Noite";
  kind: "teoria" | "questoes" | "revisao";
  instruction: string;
};

export type StudyRoutinePolicy = {
  blocks: StudyBlock[];
  maxSubjectsPerDay: number;
  avoidConsecutiveSubjectDays: boolean;
  maxStudyDaysPerSubjectPerWeek: number;
};

export type StudyPlanRequest = {
  mode?: StudyMode;
  routine: RoutineInput;
  editalText?: string;
  editalFile?: {
    name: string;
    type: string;
    data: string;
  };
  subjects?: SubjectInput[];
};

export type PlanSource = "openai" | "rules";

export type ScheduleStatus = "planned" | "in_progress" | "completed" | "partial" | "postponed" | "missed";

export type RecallRating = "forgot" | "hard" | "good" | "easy";

export type SessionFeedback = {
  scheduleItemId?: string;
  topicId?: string;
  topicTitle: string;
  kind: ScheduleItem["kind"];
  status: Extract<ScheduleStatus, "completed" | "partial" | "postponed" | "missed">;
  actualMinutes: number;
  questions: number;
  correct: number;
  difficulty?: number;
  confidence?: number;
  completionPercent: number;
  recallRating?: RecallRating;
  notes: string;
};

export type StudySessionRecord = {
  id: string;
  date: string;
  subject: string;
  scheduleItemId?: string;
  topicId?: string;
  topic?: string;
  kind?: ScheduleItem["kind"] | "simulado";
  minutes: number;
  questions: number;
  correct: number;
  difficulty?: number;
  confidence?: number;
  completionPercent?: number;
  recallRating?: RecallRating;
  notes: string;
};

export type ErrorEntry = {
  id: string;
  subjectId?: string;
  topicId?: string;
  subject: string;
  topic?: string;
  title: string;
  details: string;
  errorType: "content" | "interpretation" | "attention" | "calculation";
  source?: string;
  resolved: boolean;
  nextReviewAt?: string;
  createdAt: string;
};

export type SimulationRecord = {
  id: string;
  title: string;
  date: string;
  totalQuestions: number;
  correct: number;
  durationMinutes: number;
  notes: string;
  results?: Array<{
    subjectId?: string;
    subject: string;
    questions: number;
    correct: number;
  }>;
};

export type TopicMastery = {
  topicId?: string;
  subject: string;
  topic: string;
  coverage: number;
  accuracy: number;
  retention: number;
  mastery: number;
  lastStudiedAt?: string;
  nextReviewAt?: string;
};

export type ReviewState = {
  topicId: string;
  dueAt: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReviewAt?: string;
};

export type RebalanceMove = {
  itemId: string;
  subject: string;
  topic: string;
  fromDate: string;
  toDate: string;
  period: ScheduleItem["period"];
  minutes: number;
};

export type RebalancePreview = {
  risk: "comfortable" | "tight" | "unviable";
  remainingMinutes: number;
  availableMinutes: number;
  backlogMinutes: number;
  moves: RebalanceMove[];
  schedule: ScheduleItem[];
  suggestions: string[];
};

export type ScheduleItem = {
  id?: string;
  topicId?: string;
  date: string;
  weekday: string;
  period: "Manha" | "Tarde" | "Noite";
  subject: string;
  topic: string;
  kind: "teoria" | "questoes" | "revisao" | "simulado";
  minutes: number;
  status?: ScheduleStatus;
  completionPercent?: number;
  completedAt?: string;
  rescheduledFromId?: string;
};

export type GeneratedPlan = {
  title: string;
  examDate: string;
  summary: string;
  subjects: SubjectInput[];
  schedule: ScheduleItem[];
  recommendations: string[];
  source?: PlanSource;
};

export type CreditBalance = {
  available: number;
  pending: number;
};
