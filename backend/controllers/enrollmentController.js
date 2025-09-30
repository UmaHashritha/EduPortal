const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    console.log('=== ENROLLMENT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    const studentId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    console.log('Course found:', course ? 'Yes' : 'No');
    if (course) {
      console.log('Course title:', course.title);
      console.log('Course published:', course.isPublished);
    }
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is published
    console.log('Checking if course is published...');
    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if user is already enrolled
    console.log('Checking existing enrollment...');
    console.log('Student ID:', studentId, 'Course ID:', courseId);
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    if (existingEnrollment) {
      console.log('Found existing enrollment:', existingEnrollment._id);
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId
    });

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 }
    });

    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(studentId, {
      $push: { enrolledCourses: courseId }
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title description instructor thumbnail')
      .populate('student', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: populatedEnrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during enrollment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user enrollments
// @route   GET /api/enrollments
// @access  Private
const getMyEnrollments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { student: req.user.id };

    // Add status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title description instructor thumbnail duration category level rating')
      .populate('course.instructor', 'firstName lastName')
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
const getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('student', 'firstName lastName email')
      .populate('course.instructor', 'firstName lastName profilePicture');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment or is admin/instructor
    if (enrollment.student._id.toString() !== req.user.id &&
        req.user.role !== 'admin' &&
        enrollment.course.instructor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this enrollment'
      });
    }

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const { lessonId, percentageComplete } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment'
      });
    }

    // Update progress
    const updateData = {
      'progress.lastAccessedAt': new Date()
    };

    if (lessonId) {
      // Check if lesson already completed
      const alreadyCompleted = enrollment.progress.completedLessons.find(
        lesson => lesson.lessonId.toString() === lessonId
      );

      if (!alreadyCompleted) {
        updateData.$push = {
          'progress.completedLessons': {
            lessonId,
            completedAt: new Date()
          }
        };
      }
    }

    if (percentageComplete !== undefined) {
      updateData['progress.percentageComplete'] = Math.min(100, Math.max(0, percentageComplete));

      // If 100% complete, update status and completion date
      if (percentageComplete >= 100) {
        updateData.status = 'completed';
        updateData.completionDate = new Date();
      }
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('course', 'title');

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: updatedEnrollment
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during progress update'
    });
  }
};

// @desc    Unenroll from course
// @route   DELETE /api/enrollments/:id
// @access  Private
const unenrollFromCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unenroll from this course'
      });
    }

    // Update enrollment status instead of deleting
    enrollment.status = 'dropped';
    await enrollment.save();

    // Decrease course enrollment count
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { enrollmentCount: -1 }
    });

    // Remove course from user's enrolled courses
    await User.findByIdAndUpdate(enrollment.student, {
      $pull: { enrolledCourses: enrollment.course }
    });

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during unenrollment'
    });
  }
};

// @desc    Get course enrollments (for instructors)
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Instructor/Admin)
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view course enrollments'
      });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'firstName lastName email profilePicture')
      .sort({ enrollmentDate: -1 });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getEnrollment,
  updateProgress,
  unenrollFromCourse,
  getCourseEnrollments
};
