import prisma from "../../lib/dbConnection";
import type { Request, Response } from "express";
import * as z from "zod";
import axios from "axios";
import { google } from "googleapis";
import { HttpError, convertToGoogleCalendarEvent } from "../../lib/utils";

// Enums for the event zod schema
const EventPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);
const EventStatus = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
const calendar_Id = "primary";
const GoogleAPIUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendar_Id}/events`;

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
    try {
      // sync with google calendar

      const googleEvent = convertToGoogleCalendarEvent(newEvent);
    } catch (err) {}

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

// Get all events for a user
export const getUserEvents = async (req: Request, res: Response) => {
  try {
    // TODO: get user id from auth middleware instead of params
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const events = await prisma.event.findMany({
      where: { userId },
      include: { reminders: true, checklist: true, partners: true },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ events });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single event by ID

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // ! validate id wtf is going on here, this medssage is not displaying
    if (!id || id.trim() === "" || id === undefined || id === null) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        reminders: true,
        checklist: true,
        partners: true,
        eventType: true,
      },
    });

    // ? does this return empty object if not found or null?
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.status(200).json({ event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch event" });
  }
};

// Update an event by ID

//  TODO : before updating figure out how to handle fields that are being updated and not updated
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: updatedData,
    });

    if (!event) {
      return res.status(404).json({ message: `Event with ID ${id} not found` });
    }

    return res.status(200).json({ event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update event" });
  }
};

// Delete an event by ID
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.delete({
      where: { id },
    });
    if (!event) {
      return res.status(404).json({ message: `Event with ID ${id} not found` });
    }

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete event" });
  }
};
// TODO contorller to get all user events with filters

// Get events within a date range for a user
export const getUserEventsInRange = async (req: Request, res: Response) => {
  try {
    // TODO: get user id from auth middleware instead of params
    const userId = req.params.userId;
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const events = await prisma.event.findMany({
      where: {
        userId,
        startDate: {
          gte: new Date(startDate as string),
        },
        endDate: { lte: new Date(endDate as string) },
      },
      include: {
        reminders: true,
        checklist: true,
        partners: true,
        eventType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ events });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching events by date range" });
  }
};

// Get events by event type for a user
export const getUserEventsByType = async (req: Request, res: Response) => {
  try {
    // TODO get user id from the auth middleware instead of params
    const { userId } = req.params;
    const { eventTypeId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const events = await prisma.event.findMany({
      where: {
        userId,
        eventTypeId: eventTypeId as string,
      },
      include: {
        reminders: true,
        checklist: true,
        partners: true,
        eventType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ events });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching events by event type" });
  }
};
