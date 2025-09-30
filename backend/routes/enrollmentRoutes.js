const express = require('express');
const { body } = require('express-validator');
const {
  enrollInCourse,
  getMyEnrollments,
  getEnrollment,
  updateProgress,
  unenrollFromCourse,
  getCourseEnrollments
} = require('../controllers/enrollmentController');
const { protect, instructorOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const enrollmentValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID format')
];

const progressValidation = [
  body('lessonId')
    .optional()
    .isMongoId()
    .withMessage('Invalid lesson ID format'),
  body('percentageComplete')
    .optional()
    .isNumeric()
    .withMessage('Percentage complete must be a number')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage complete must be between 0 and 100')
];

// Routes
router.route('/')
  .get(protect, getMyEnrollments)
  .post(protect, enrollmentValidation, enrollInCourse);

router.route('/:id')
  .get(protect, getEnrollment)
  .delete(protect, unenrollFromCourse);

router.route('/:id/progress')
  .put(protect, progressValidation, updateProgress);

router.route('/course/:courseId')
  .get(protect, instructorOrAdmin, getCourseEnrollments);

module.exports = router;
