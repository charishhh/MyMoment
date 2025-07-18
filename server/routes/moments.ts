import { RequestHandler } from "express";
import { Moment, Reply } from "../../shared/api";

// In-memory storage for moments and replies (in production, you'd use a database)
let moments: Moment[] = [];
let replies: Reply[] = [];

// Get all moments with their replies
export const getMoments: RequestHandler = (req, res) => {
  // Add replies to each moment
  const momentsWithReplies = moments.map((moment) => {
    const momentReplies = replies
      .filter((reply) => reply.momentId === moment.id)
      .sort((a, b) => a.timestamp - b.timestamp); // Oldest replies first

    return {
      ...moment,
      replies: momentReplies,
      replyCount: momentReplies.length,
    };
  });

  // Sort by timestamp (newest first)
  const sortedMoments = momentsWithReplies.sort(
    (a, b) => b.timestamp - a.timestamp,
  );
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
      replies: [],
      replyCount: 0,
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

    // Also delete all replies to this moment
    replies = replies.filter((reply) => reply.momentId !== id);

    const deletedMoment = moments.splice(momentIndex, 1)[0];
    res.json(deletedMoment);
  } catch (error) {
    console.error("Error deleting moment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new reply
export const createReply: RequestHandler = (req, res) => {
  try {
    const { text, anonymousId, displayName, momentId } = req.body;

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

    if (!momentId || typeof momentId !== "string") {
      return res.status(400).json({ error: "Moment ID is required" });
    }

    // Check if the moment exists
    const moment = moments.find((m) => m.id === momentId);
    if (!moment) {
      return res.status(404).json({ error: "Moment not found" });
    }

    const newReply: Reply = {
      id: crypto.randomUUID(),
      text: text.trim(),
      anonymousId,
      displayName: displayName || "Anonymous User",
      timestamp: Date.now(),
      momentId,
    };

    replies.push(newReply);

    // Keep only the last 5000 replies to prevent memory issues
    if (replies.length > 5000) {
      replies = replies.slice(-5000);
    }

    res.status(201).json(newReply);
  } catch (error) {
    console.error("Error creating reply:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a reply (only by the user who created it)
export const deleteReply: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId } = req.body;

    if (!anonymousId) {
      return res.status(400).json({ error: "Anonymous ID is required" });
    }

    const replyIndex = replies.findIndex(
      (reply) => reply.id === id && reply.anonymousId === anonymousId,
    );

    if (replyIndex === -1) {
      return res.status(404).json({ error: "Reply not found or unauthorized" });
    }

    const deletedReply = replies.splice(replyIndex, 1)[0];
    res.json(deletedReply);
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
