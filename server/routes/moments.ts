import { RequestHandler } from "express";

export interface Moment {
  id: string;
  text: string;
  image?: string;
  anonymousId: string;
  displayName: string;
  timestamp: number;
}

// In-memory storage for moments (in production, you'd use a database)
let moments: Moment[] = [];

// Get all moments
export const getMoments: RequestHandler = (req, res) => {
  // Sort by timestamp (newest first)
  const sortedMoments = [...moments].sort((a, b) => b.timestamp - a.timestamp);
  res.json(sortedMoments);
};

// Create a new moment
export const createMoment: RequestHandler = (req, res) => {
  try {
    const { text, image, anonymousId, displayName } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (text.length > 280) {
      return res
        .status(400)
        .json({ error: "Text must be 280 characters or less" });
    }

    if (!anonymousId || typeof anonymousId !== "string") {
      return res.status(400).json({ error: "Anonymous ID is required" });
    }

    const newMoment: Moment = {
      id: crypto.randomUUID(),
      text: text.trim(),
      image: image || undefined,
      anonymousId,
      displayName: displayName || "Anonymous User",
      timestamp: Date.now(),
    };

    moments.unshift(newMoment); // Add to beginning of array

    // Keep only the last 1000 moments to prevent memory issues
    if (moments.length > 1000) {
      moments = moments.slice(0, 1000);
    }

    res.status(201).json(newMoment);
  } catch (error) {
    console.error("Error creating moment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a moment (only by the user who created it)
export const deleteMoment: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId } = req.body;

    if (!anonymousId) {
      return res.status(400).json({ error: "Anonymous ID is required" });
    }

    const momentIndex = moments.findIndex(
      (moment) => moment.id === id && moment.anonymousId === anonymousId,
    );

    if (momentIndex === -1) {
      return res
        .status(404)
        .json({ error: "Moment not found or unauthorized" });
    }

    const deletedMoment = moments.splice(momentIndex, 1)[0];
    res.json(deletedMoment);
  } catch (error) {
    console.error("Error deleting moment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
