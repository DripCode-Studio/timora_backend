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
  title: string;
  eventTypeId: string;
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
  recurrenceRule?: string; // RULE format for recurring events
  userId: string;
}
