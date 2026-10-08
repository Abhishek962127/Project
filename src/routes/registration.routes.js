const express = require("express");
const mongoose = require("mongoose");

const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Register current user for an event.
// Uses an atomic capacity update so it works with a normal local MongoDB server.
router.post("/events/:eventId", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID"
      });
    }

    const eventId = req.params.eventId;

    const event = await Event.findOne({
      _id: eventId,
      date: { $gt: new Date() }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or registration is closed"
      });
    }

    const existing = await Registration.findOne({
      user: req.user._id,
      event: eventId
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You are already registered for this event"
      });
    }

    // Only one request that still has an available seat can increment the count.
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        date: { $gt: new Date() },
        $expr: { $lt: ["$registeredCount", "$capacity"] }
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(409).json({
        success: false,
        message: "Event is full"
      });
    }

    try {
      const registration = await Registration.create({
        user: req.user._id,
        event: eventId
      });

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        data: registration
      });
    } catch (error) {
      // If the unique index catches a race-condition duplicate, restore capacity.
      if (error.code === 11000) {
        await Event.findByIdAndUpdate(eventId, {
          $inc: { registeredCount: -1 }
        });

        return res.status(409).json({
          success: false,
          message: "You are already registered for this event"
        });
      }

      await Event.findByIdAndUpdate(eventId, {
        $inc: { registeredCount: -1 }
      });

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Current user's registrations.
router.get("/me", protect, async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate({
        path: "event",
        populate: { path: "organizer", select: "name email" }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
});

// Cancel current user's registration.
router.delete("/:registrationId", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.registrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration ID"
      });
    }

    const registration = await Registration.findOne({
      _id: req.params.registrationId,
      user: req.user._id
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    await registration.deleteOne();

    await Event.findByIdAndUpdate(registration.event, {
      $inc: { registeredCount: -1 }
    });

    res.json({
      success: true,
      message: "Registration cancelled"
    });
  } catch (error) {
    next(error);
  }
});

// Organizer/admin: see registrations for an event.
router.get("/event/:eventId", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID"
      });
    }

    const event = await Event.findById(req.params.eventId);

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
        message: "You cannot view registrations for this event"
      });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;