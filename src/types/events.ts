export enum EventType {
  LECTURE = "LECTURE",
  STUDY = "STUDY",
  ASSIGNMENT = "ASSIGNMENT",
  EXAM = "EXAM",
}

export enum priority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum EventStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  color: string;
  priority: priority;
  status: EventStatus;
  isRecurring: boolean;
  recurrencePattern?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
