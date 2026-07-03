export type StudyMode = "manual" | "ai";

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

export type StudyPlanRequest = {
  mode: StudyMode;
  routine: RoutineInput;
  editalText?: string;
  subjects?: SubjectInput[];
};

export type ScheduleItem = {
  date: string;
  weekday: string;
  period: "Manha" | "Tarde" | "Noite";
  subject: string;
  topic: string;
  kind: "teoria" | "questoes" | "revisao";
  minutes: number;
};

export type GeneratedPlan = {
  title: string;
  examDate: string;
  summary: string;
  subjects: SubjectInput[];
  schedule: ScheduleItem[];
  recommendations: string[];
};

export type CreditBalance = {
  available: number;
  pending: number;
};
