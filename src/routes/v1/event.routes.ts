import express from "express";
import {
  createEvent,
  getEventById,
  deleteEvent,
  getUserEventsInRange,
  getUserEventsByType,
} from "../../controllers/v1/event.controller";
import authMiddleware from "../../middlewares/auth.middleware";
const eventRoutes = express.Router();

eventRoutes.post("/create-event", createEvent);
eventRoutes.get("/:id", getEventById);
// eventRoutes.put("/:id", updateEvent);
eventRoutes.delete("/:id", deleteEvent);
eventRoutes.get("/user-events/:id", getUserEventsInRange);

export default eventRoutes;
