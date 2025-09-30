import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CourseContentBuilder from './CourseContentBuilder';
import axios from 'axios';

const CreateCourse = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    duration: '',
    price: '',
    thumbnail: '',
    prerequisites: '',
    learningOutcomes: '',
    tags: '',
    isPublished: false
  });
  const [courseModules, setCourseModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not an instructor
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'instructor' && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const {
    title,
    description,
    category,
    level,
    duration,
    price,
    thumbnail,
    prerequisites,
    learningOutcomes,
    tags,
    isPublished
  } = formData;

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
    setSuccess('');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Enhanced validation for Step 1
      if (!title || title.trim().length < 5) {
        setError('Course title must be at least 5 characters long');
        return;
      }

      if (!description || description.trim().length < 20) {
        setError('Course description must be at least 20 characters long');
        return;
      }

      if (!category || !level || !duration || !price) {
        setError('Please fill in all required fields (category, level, duration, price)');
        return;
      }

      if (parseInt(duration) < 1) {
        setError('Duration must be at least 1 hour');
        return;
      }

      if (parseFloat(price) < 0) {
        setError('Price cannot be negative');
        return;
      }
    }

    setCurrentStep(currentStep + 1);
    setError('');
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    courseModules.forEach(module => {
      module.lessons.forEach(lesson => {
        totalMinutes += lesson.duration || 0;
      });
    });
    return Math.ceil(totalMinutes / 60); // Convert to hours
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Enhanced validation
    if (!title || title.trim().length < 5) {
      setError('Course title must be at least 5 characters long');
      setLoading(false);
      return;
    }

    if (!description || description.trim().length < 20) {
      setError('Course description must be at least 20 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Raw courseModules before cleaning:', courseModules);

      // Clean up modules data - remove frontend-only fields and fix data types
      const cleanedModules = courseModules.map(module => {
        console.log('Processing module:', module);
        return {
          title: module.title || '',
          description: module.description || '',
          lessons: module.lessons.map(lesson => {
            console.log('Raw lesson before cleaning:', lesson);
            console.log('lesson.resources type:', typeof lesson.resources, lesson.resources);

            // Handle stringified resources
            let resources = lesson.resources || [];
            if (typeof resources === 'string') {
              try {
                resources = JSON.parse(resources);
                console.log('Parsed resources from string:', resources);
              } catch (e) {
                console.error('Failed to parse resources string:', e);
                resources = [];
              }
            }

            const cleanedLesson = {
              title: lesson.title || '',
              type: lesson.type || 'video',
              content: lesson.content || '',
              duration: parseInt(lesson.duration) || 0,
              resources: Array.isArray(resources)
                ? resources.map(resource => ({
                    name: resource.name || '',
                    type: resource.type || '',
                    size: parseInt(resource.size) || 0,
                    url: resource.url || ''
                  }))
                : [], // Ensure resources is always an array
              order: 0
            };
            console.log('Cleaned lesson:', cleanedLesson);
            return cleanedLesson;
          }),
          order: 0
        };
      });

      console.log('All cleaned modules:', cleanedModules);

      // Calculate total duration from modules
      const calculatedDuration = calculateTotalDuration();
      const finalDuration = calculatedDuration > 0 ? calculatedDuration : parseInt(duration);

      // Transform modules for backend
      const transformedSyllabus = cleanedModules.map(module => ({
        title: module.title || 'Untitled Module',
        description: module.description || 'Module description',
        duration: module.lessons.reduce((sum, lesson) => sum + (parseInt(lesson.duration) || 0), 0),
        resources: module.lessons
          .map(lesson => lesson.content)
          .filter(content => content && content.trim())
      }));

      // Prepare data for submission
      const courseData = {
        title: title.trim(),
        description: description.trim(),
        category,
        level,
        duration: finalDuration,
        price: parseFloat(price),
        thumbnail: thumbnail.trim(),
        prerequisites: prerequisites ? prerequisites.split('\n').filter(p => p.trim()) : [],
        learningOutcomes: learningOutcomes ? learningOutcomes.split('\n').filter(o => o.trim()) : [],
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        syllabus: transformedSyllabus,
        isPublished,
        // Add the structured content
        modules: cleanedModules
      };

      console.log('=== COURSE CREATION DEBUG ===');
      console.log('Frontend course data:', JSON.stringify(courseData, null, 2));

      // Special debug for modules
      console.log('Modules structure:', JSON.stringify(courseData.modules, null, 2));

      console.log('Auth token present:', !!localStorage.getItem('token'));
      console.log('User info:', user);

      // Ensure we have proper headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const res = await axios.post('/api/courses', courseData, config);

      console.log('Backend response:', res.data);
      if (res.data.success) {
        setSuccess('Course created successfully with all content!');
        setTimeout(() => {
          navigate(`/courses/${res.data.data._id}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Create course error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      if (err.response?.data?.errors) {
        // Show validation errors from backend
        console.log('Raw validation errors:', err.response.data.errors);
        const validationErrors = err.response.data.errors.map(error => {
          // Handle both express-validator format and mongoose format
          if (error.msg) return error.msg;
          if (error.message) return error.message;
          if (typeof error === 'string') return error;
          return 'Unknown validation error';
        }).filter(msg => msg && msg !== 'Unknown validation error').join(', ');

        console.log('Formatted validation errors:', validationErrors);
        setError(`Validation failed: ${validationErrors}`);
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to create course';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <div className="loading">Loading...</div>;
  }

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
        <span className="step-number">1</span>
        <span className="step-label">Basic Info</span>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
        <span className="step-number">2</span>
        <span className="step-label">Course Content</span>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <span className="step-number">3</span>
        <span className="step-label">Review & Publish</span>
      </div>
    </div>
  );

  return (
    <div className="create-course-page">
      <div className="container">
        <div className="page-header">
          <h1>Create New Course</h1>
          <p>Share your knowledge with students around the world</p>
        </div>

        {renderStepIndicator()}

        <div className="create-course-form-container">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={onSubmit} className="create-course-form">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="form-step">
                <div className="form-section">
                  <h2>Basic Information</h2>

                  <div className="form-group">
                    <label htmlFor="title">Course Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={title}
                      onChange={onChange}
                      placeholder="Enter a compelling course title (minimum 5 characters)"
                      required
                    />
                    <small className="form-help">
                      {title.length}/5 characters minimum {title.length >= 5 ? '✅' : '❌'}
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Course Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      value={description}
                      onChange={onChange}
                      placeholder="Describe what students will learn in this course (minimum 20 characters)"
                      rows="4"
                      required
                    />
                    <small className="form-help">
                      {description.length}/20 characters minimum {description.length >= 20 ? '✅' : '❌'}
                    </small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category *</label>
                      <select
                        id="category"
                        name="category"
                        value={category}
                        onChange={onChange}
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="Technology">Technology</option>
                        <option value="Business">Business</option>
                        <option value="Arts">Arts</option>
                        <option value="Science">Science</option>
                        <option value="Language">Language</option>
                        <option value="Health">Health</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="level">Difficulty Level *</label>
                      <select
                        id="level"
                        name="level"
                        value={level}
                        onChange={onChange}
                        required
                      >
                        <option value="">Select difficulty level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="duration">Estimated Duration (hours) *</label>
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={duration}
                        onChange={onChange}
                        placeholder="e.g., 10"
                        min="1"
                        required
                      />
                      <small className="form-help">This will be updated based on your actual content</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="price">Price ($) *</label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={price}
                        onChange={onChange}
                        placeholder="0 for free course"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="thumbnail">Course Thumbnail URL</label>
                    <input
                      type="url"
                      id="thumbnail"
                      name="thumbnail"
                      value={thumbnail}
                      onChange={onChange}
                      placeholder="https://example.com/course-image.jpg"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prerequisites">Prerequisites</label>
                    <textarea
                      id="prerequisites"
                      name="prerequisites"
                      value={prerequisites}
                      onChange={onChange}
                      placeholder="Enter each prerequisite on a new line&#10;e.g.:&#10;Basic knowledge of JavaScript&#10;Familiarity with web development"
                      rows="3"
                    />
                    <small className="form-help">Enter each prerequisite on a separate line</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="learningOutcomes">Learning Outcomes</label>
                    <textarea
                      id="learningOutcomes"
                      name="learningOutcomes"
                      value={learningOutcomes}
                      onChange={onChange}
                      placeholder="Enter each learning outcome on a new line&#10;e.g.:&#10;Build a complete web application&#10;Understand React fundamentals"
                      rows="4"
                    />
                    <small className="form-help">Enter each learning outcome on a separate line</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tags">Tags</label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={tags}
                      onChange={onChange}
                      placeholder="javascript, react, web development, frontend"
                    />
                    <small className="form-help">Separate tags with commas</small>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Course Content */}
            {currentStep === 2 && (
              <div className="form-step">
                <CourseContentBuilder
                  modules={courseModules}
                  onChange={setCourseModules}
                />
                <div className="content-summary">
                  <h3>Content Summary</h3>
                  <p><strong>Modules:</strong> {courseModules.length}</p>
                  <p><strong>Total Lessons:</strong> {courseModules.reduce((sum, module) => sum + module.lessons.length, 0)}</p>
                  <p><strong>Calculated Duration:</strong> {calculateTotalDuration()} hours</p>
                </div>
              </div>
            )}

            {/* Step 3: Review & Publish */}
            {currentStep === 3 && (
              <div className="form-step">
                <div className="form-section">
                  <h2>Review Your Course</h2>

                  <div className="course-review">
                    <div className="review-section">
                      <h3>{title}</h3>
                      <p className="course-meta">{category} • {level} • {calculateTotalDuration() || duration} hours</p>
                      <p>{description}</p>

                      <div className="review-stats">
                        <div className="stat">
                          <strong>{courseModules.length}</strong>
                          <span>Modules</span>
                        </div>
                        <div className="stat">
                          <strong>{courseModules.reduce((sum, module) => sum + module.lessons.length, 0)}</strong>
                          <span>Lessons</span>
                        </div>
                        <div className="stat">
                          <strong>${price}</strong>
                          <span>Price</span>
                        </div>
                      </div>

                      {courseModules.length > 0 && (
                        <div className="content-preview">
                          <h4>Course Content Preview</h4>
                          {courseModules.map((module, index) => (
                            <div key={module.id} className="module-preview">
                              <h5>Module {index + 1}: {module.title}</h5>
                              <p>{module.description}</p>
                              <ul>
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <li key={lesson.id}>
                                    {lesson.title} ({lesson.type}) - {lesson.duration || 0} min
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={isPublished}
                        onChange={onChange}
                      />
                      <span className="checkmark"></span>
                      Publish course immediately
                    </label>
                    <small className="form-help">
                      If unchecked, the course will be saved as draft and not visible to students
                    </small>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating Course...' : 'Create Course'}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
