import prisma from "../../lib/dbConnection";
import type { Request, Response } from "express";
import * as z from "zod";
import type { Event } from "../../types/events";
import { HttpError } from "../../lib/utils";
import { de } from "zod/locales";

// Enums for the event zod schema
const EventPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);
const EventStatus = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// zod schema for event validation
const eventSchema = z.object({
  title: z.string({ message: "Title is required" }).min(1, "Title required"),
  eventTypeId: z.string(),
  description: z.string({ message: "Description is required" }).optional(),
  location: z.string({ message: "Location is required" }).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  startTime: z.iso.time({ precision: -1 }),
  endTime: z.iso.time({ precision: -1 }),
  isAllDay: z.boolean().optional(),
  color: z
    .string({ message: "Color is required" })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  priority: EventPriority,
  status: EventStatus,
  isRecurring: z.boolean(),
  recurrenceRule: z.string().optional(),
  userId: z.string(),
});

// create new event
export const createEvent = async (req: Request, res: Response) => {
  try {
    // First validate the schema
    const validatedData = eventSchema.parse(req.body);

    // Create event data object with required fields
    const eventData = {
      title: validatedData.title,
      eventTypeId: validatedData.eventTypeId,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      color: validatedData.color,
      isAllDay: validatedData.isAllDay,
      priority: validatedData.priority,
      status: validatedData.status,
      isRecurring: validatedData.isRecurring,
      userId: validatedData.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    // Add optional fields only if they exist
    if (validatedData.description)
      eventData.description = validatedData.description;
    if (validatedData.location) eventData.location = validatedData.location;
    if (validatedData.recurrenceRule)
      eventData.recurrenceRule = validatedData.recurrenceRule;

    const newEvent = await prisma.event.create({
      data: eventData,
    });

    if (newEvent) {
      return res.status(201).json({ message: "Event created successfully" });
    } else {
      throw new HttpError("Event creation failed", "CreationError", 500);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // get all zod error messages
      const messages = error.issues.map((e: any) => e.message);
      return res
        .status(400)
        .json({ message: "Invalid input data", errors: messages });
    } else if (error.message === "CreationError") {
      // Handle creation errors
      return res.status(500).json({ message: error.message });
    } else {
      // Handle other errors
      return res.status(500).json({ message: error.message });
    }
  }
};
