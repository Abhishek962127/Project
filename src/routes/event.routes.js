const express = require("express");
const { body, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: errors.array()
    });
  }
  next();
}

// Public: list events with search, category filter, and pagination.
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("search").optional().trim(),
    query("category").optional().trim(),
    query("upcoming").optional().isBoolean().toBoolean()
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      const filter = {};

      if (req.query.search) {
        filter.$or = [
          { title: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
          { location: { $regex: req.query.search, $options: "i" } }
        ];
      }

      if (req.query.category) {
        filter.category = req.query.category;
      }

      if (req.query.upcoming === true) {
        filter.date = { $gte: new Date() };
      }

      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate("organizer", "name email")
          .sort({ date: 1 })
          .skip(skip)
          .limit(limit),
        Event.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Public: event details.
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID"
      });
    }

    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
);

// Organizer/admin: create event.
router.post(
  "/",
  protect,
  authorize("organizer", "admin"),
  [
    body("title").trim().isLength({ min: 3, max: 150 }),
    body("description").trim().isLength({ min: 10 }),
    body("location").trim().notEmpty(),
    body("date").isISO8601(),
    body("capacity").isInt({ min: 1 }),
    body("category").optional().trim(),
    body("imageUrl").optional().isURL()
  ],
  validate,
  async (req, res, next) => {
    try {
      const event = await Event.create({
        ...req.body,
        capacity: Number(req.body.capacity),
        organizer: req.user._id
      });

      res.status(201).json({
        success: true,
        message: "Event created",
        data: event
      });
    } catch (error) {
      next(error);
    }
  }
);

// Organizer/admin: update own event; admin can update any event.
router.put(
  "/:id",
  protect,
  authorize("organizer", "admin"),
  async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }

      if (
        req.user.role !== "admin" &&
        event.organizer.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own events"
        });
      }

      if (req.body.capacity !== undefined) {
        const capacity = Number(req.body.capacity);

        if (!Number.isInteger(capacity) || capacity < event.registeredCount) {
          return res.status(400).json({
            success: false,
            message: `Capacity cannot be less than current registrations (${event.registeredCount})`
          });
        }

        req.body.capacity = capacity;
      }

      Object.assign(event, req.body);
      await event.save();

      res.json({
        success: true,
        message: "Event updated",
        data: event
      });
    } catch (error) {
      next(error);
    }
  }
);

// Organizer/admin: delete own event; admin can delete any event.
router.delete(
  "/:id",
  protect,
  authorize("organizer", "admin"),
  async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }

      if (
        req.user.role !== "admin" &&
        event.organizer.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own events"
        });
      }

      await Registration.deleteMany({ event: event._id });
      await event.deleteOne();

      res.json({
        success: true,
        message: "Event and its registrations deleted"
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;