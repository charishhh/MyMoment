import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getMoments,
  createMoment,
  deleteMoment,
  createReply,
  deleteReply,
} from "./routes/moments";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Moments API routes
  app.get("/api/moments", getMoments);
  app.post("/api/moments", createMoment);
  app.delete("/api/moments/:id", deleteMoment);

  return app;
}
