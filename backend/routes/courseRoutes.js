const express = require('express');
const { body } = require('express-validator');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseReview
} = require('../controllers/courseController');
const { protect, instructorOrAdmin, anyRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const courseValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Course title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Course description must be between 20 and 1000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Course category is required')
    .isIn(['Technology', 'Business', 'Arts', 'Science', 'Language', 'Health', 'Other'])
    .withMessage('Invalid course category'),
  body('level')
    .notEmpty()
    .withMessage('Course level is required')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Course level must be Beginner, Intermediate, or Advanced'),
  body('duration')
    .isNumeric()
    .withMessage('Duration must be a number')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 hour'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative')
];

const reviewValidation = [
  body('rating')
    .isNumeric()
    .withMessage('Rating must be a number')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// Routes
// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Course API is working',
    timestamp: new Date().toISOString()
  });
});

router.route('/')
  .get(getCourses)
  .post(protect, instructorOrAdmin, courseValidation, createCourse);

router.route('/:id')
  .get(getCourse)
  .put(protect, instructorOrAdmin, updateCourse)
  .delete(protect, instructorOrAdmin, deleteCourse);

router.route('/:id/reviews')
  .post(protect, anyRole, reviewValidation, addCourseReview);

module.exports = router;
