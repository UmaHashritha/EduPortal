const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  progress: {
    completedLessons: [{
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    percentageComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended'],
    default: 'active'
  },
  completionDate: {
    type: Date
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  certificates: [{
    type: {
      type: String,
      enum: ['completion', 'achievement', 'participation']
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    certificateUrl: String
  }],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index to ensure unique enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Index for querying enrollments by status
enrollmentSchema.index({ status: 1 });

// Method to calculate progress percentage
enrollmentSchema.methods.calculateProgress = function() {
  // This would be implemented based on the course structure
  // For now, it's a placeholder
  return this.progress.percentageComplete;
};

// Static method to get enrollment statistics
enrollmentSchema.statics.getEnrollmentStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
