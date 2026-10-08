const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const createToken = require("../utils/token");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

function validationErrors(req, res, next) {
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

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 })
  ],
  validationErrors,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({
        name,
        email,
        password: hashedPassword
      });

      res.status(201).json({
        success: true,
        message: "Account created",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token: createToken(user)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty()
  ],
  validationErrors,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email }).select("+password");

      if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token: createToken(user)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;