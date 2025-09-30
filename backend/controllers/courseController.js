const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isPublished: true };

    // Add search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Add category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Add level filter
    if (req.query.level) {
      query.level = req.query.level;
    }

    // Add price filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseInt(req.query.maxPrice);
    }

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName profilePicture bio')
      .populate('reviews.user', 'firstName lastName');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
const createCourse = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add instructor to req.body
    console.log('Creating course with data:', req.body);

    // Debug modules data
    if (req.body.modules && req.body.modules.length > 0) {
      console.log('First module:', JSON.stringify(req.body.modules[0], null, 2));

      // Debug specific lesson resources
      if (req.body.modules[0].lessons && req.body.modules[0].lessons.length > 0) {
        console.log('First lesson resources type:', typeof req.body.modules[0].lessons[0].resources);
        console.log('First lesson resources value:', req.body.modules[0].lessons[0].resources);
      }
    }

    console.log('User ID:', req.user.id);
    req.body.instructor = req.user.id;

    // Preprocess modules to handle stringified resources
    if (req.body.modules && Array.isArray(req.body.modules)) {
      req.body.modules = req.body.modules.map(module => {
        if (module.lessons && Array.isArray(module.lessons)) {
          module.lessons = module.lessons.map(lesson => {
            if (lesson.resources) {
              // Handle stringified resources
              if (typeof lesson.resources === 'string') {
                try {
                  lesson.resources = JSON.parse(lesson.resources);
                  console.log('Parsed stringified resources:', lesson.resources);
                } catch (e) {
                  console.error('Failed to parse lesson resources:', e);
                  lesson.resources = [];
                }
              }
              // Ensure resources is always an array
              if (!Array.isArray(lesson.resources)) {
                lesson.resources = [];
              }
            }
            return lesson;
          });
        }
        return module;
      });
    }

    // DEBUG: Create a simple course without modules first to test basic functionality
    const testCourseData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      level: req.body.level,
      duration: req.body.duration,
      price: req.body.price,
      instructor: req.user.id,
      modules: [] // Empty modules to avoid the resources issue
    };

    console.log('Testing course creation without modules...');
    try {
      const testCourse = await Course.create(testCourseData);
      console.log('Basic course creation works! Course ID:', testCourse._id);
      await Course.findByIdAndDelete(testCourse._id); // Clean up test course
    } catch (testError) {
      console.log('Basic course creation failed:', testError.message);
    }

    const course = await Course.create(req.body);

    // Add course to user's created courses
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdCourses: course._id }
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: populatedCourse
    });
  } catch (error) {
    console.error('Create course error:', error);

    // Handle different types of errors
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

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this title already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during course creation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin)
const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('instructor', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during course update'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    // Remove course from user's created courses
    await User.findByIdAndUpdate(course.instructor, {
      $pull: { createdCourses: req.params.id }
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during course deletion'
    });
  }
};

// @desc    Add course review
// @route   POST /api/courses/:id/reviews
// @access  Private
const addCourseReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user already reviewed this course
    const alreadyReviewed = course.reviews.find(
      review => review.user.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Course already reviewed'
      });
    }

    const review = {
      user: req.user.id,
      rating: Number(rating),
      comment
    };

    course.reviews.push(review);
    course.rating.count = course.reviews.length;
    course.rating.average = course.reviews.reduce((acc, item) => item.rating + acc, 0) / course.reviews.length;

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during review addition'
    });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseReview
};
