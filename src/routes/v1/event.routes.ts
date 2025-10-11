import express from "express";
import { createEvent } from "../../controllers/v1/event.controller";

const eventRoutes = express.Router();

eventRoutes.post("/create-event", createEvent);

export default eventRoutes;