const mongoose = require('mongoose');

// Resource schema for file attachments
const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, { _id: false });

// Lesson schema for structured content
const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    default: ''
  },
  type: {
    type: String,
    enum: ['video', 'text', 'document', 'quiz'],
    default: 'video'
  },
  content: {
    type: String, // URL for videos/documents, text content for text lessons
    required: false,
    default: ''
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  resources: [resourceSchema], // Use the separate resource schema
  order: {
    type: Number,
    default: 0
  }
}, { _id: false }); // Disable automatic _id generation

// Module schema for structured content
const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  lessons: [lessonSchema],
  order: {
    type: Number,
    default: 0
  }
}, { _id: false }); // Disable automatic _id generation

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['Technology', 'Business', 'Arts', 'Science', 'Language', 'Health', 'Other']
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  duration: {
    type: Number, // Duration in hours
    required: [true, 'Course duration is required'],
    min: [1, 'Course duration must be at least 1 hour']
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Course price cannot be negative'],
    default: 0
  },
  thumbnail: {
    type: String,
    default: ''
  },
  // Legacy syllabus structure (for backward compatibility)
  syllabus: [{
    title: {
      type: String,
      required: false
    },
    description: {
      type: String,
      default: ''
    },
    duration: {
      type: Number, // Duration in minutes
      default: 0
    },
    resources: [String] // URLs to videos, documents, etc.
  }],
  // New structured content
  modules: {
    type: [moduleSchema],
    default: []
  },
  prerequisites: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Course statistics
  stats: {
    totalLessons: {
      type: Number,
      default: 0
    },
    totalModules: {
      type: Number,
      default: 0
    },
    videoCount: {
      type: Number,
      default: 0
    },
    textCount: {
      type: Number,
      default: 0
    },
    documentCount: {
      type: Number,
      default: 0
    },
    quizCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for search functionality
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to calculate course statistics
courseSchema.pre('save', function(next) {
  try {
    if (this.modules && this.modules.length > 0) {
      let totalLessons = 0;
      let videoCount = 0;
      let textCount = 0;
      let documentCount = 0;
      let quizCount = 0;

      this.modules.forEach(module => {
        if (module.lessons) {
          totalLessons += module.lessons.length;
          module.lessons.forEach(lesson => {
            switch (lesson.type) {
              case 'video':
                videoCount++;
                break;
              case 'text':
                textCount++;
                break;
              case 'document':
                documentCount++;
                break;
              case 'quiz':
                quizCount++;
                break;
            }
          });
        }
      });

      this.stats = {
        totalLessons,
        totalModules: this.modules.length,
        videoCount,
        textCount,
        documentCount,
        quizCount
      };
    } else {
      // Default stats if no modules
      this.stats = {
        totalLessons: 0,
        totalModules: 0,
        videoCount: 0,
        textCount: 0,
        documentCount: 0,
        quizCount: 0
      };
    }

    next();
  } catch (error) {
    console.error('Error in course pre-save middleware:', error);
    next(error);
  }
});

// Method to get course content structure
courseSchema.methods.getContentStructure = function() {
  return {
    totalModules: this.stats.totalModules,
    totalLessons: this.stats.totalLessons,
    contentTypes: {
      videos: this.stats.videoCount,
      texts: this.stats.textCount,
      documents: this.stats.documentCount,
      quizzes: this.stats.quizCount
    },
    estimatedDuration: this.duration
  };
};

// Static method to get course statistics
courseSchema.statics.getCourseStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        averageRating: { $avg: '$rating.average' },
        totalEnrollments: { $sum: '$enrollmentCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Course', courseSchema);
