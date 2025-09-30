import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CourseDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      console.log('=== COURSE DETAIL DEBUG ===');
      console.log('Fetching course:', id);
      console.log('Current user:', user);

      const res = await axios.get(`/api/courses/${id}`);
      setCourse(res.data.data);

      // Check if user is enrolled in this course
      if (isAuthenticated && user) {
        console.log('Checking enrollment status...');
        try {
          const enrollmentRes = await axios.get('/api/enrollments');
          const enrollments = enrollmentRes.data.data || [];
          console.log('User enrollments:', enrollments);

          const currentEnrollment = enrollments.find(e => e.course?._id === id);
          console.log('Current course enrollment:', currentEnrollment);

          if (currentEnrollment) {
            setEnrollmentStatus('enrolled');
            setEnrollmentData(currentEnrollment);
          }
        } catch (enrollErr) {
          console.log('Could not fetch enrollment status:', enrollErr);
        }
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch course details');
      console.error('Fetch course error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      alert('Please log in to enroll in courses');
      return;
    }

    try {
      await axios.post('/api/enrollments', { courseId: id });
      setEnrollmentStatus('enrolled');
      alert('Successfully enrolled in course!');
    } catch (err) {
      console.error('Enrollment error:', err);

      // Show specific error message from backend
      const errorMessage = err.response?.data?.message || 'Failed to enroll in course';
      alert(errorMessage);

      // If already enrolled, update the enrollment status
      if (err.response?.status === 400 && errorMessage.includes('already enrolled')) {
        setEnrollmentStatus('enrolled');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading course details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!course) {
    return <div className="error-message">Course not found</div>;
  }

  return (
    <div className="course-detail">
      <div className="container">
        <div className="course-header">
          <div className="course-info">
            <h1>{course.title}</h1>
            <p className="course-description">{course.description}</p>

            <div className="course-meta">
              <div className="meta-item">
                <strong>Category:</strong> {course.category}
              </div>
              <div className="meta-item">
                <strong>Level:</strong> {course.level}
              </div>
              <div className="meta-item">
                <strong>Duration:</strong> {course.duration} hours
              </div>
              <div className="meta-item">
                <strong>Price:</strong> {course.price === 0 ? 'Free' : `$${course.price}`}
              </div>
              <div className="meta-item">
                <strong>Students:</strong> {course.enrollmentCount}
              </div>
              <div className="meta-item">
                <strong>Rating:</strong> ⭐ {course.rating.average.toFixed(1)} ({course.rating.count} reviews)
              </div>
            </div>
          </div>

          <div className="course-actions">
            {course.thumbnail && (
              <div className="course-thumbnail">
                <img src={course.thumbnail} alt={course.title} />
              </div>
            )}

            <div className="enrollment-section">
              {isAuthenticated ? (
                <>
                  {enrollmentStatus === 'enrolled' ? (
                    <div className="enrolled-user-section">
                      <div className="enrollment-info">
                        <h3>✅ You're Enrolled!</h3>
                        <p>Progress: {enrollmentData?.progress?.percentageComplete || 0}% complete</p>
                        <p>Enrolled: {enrollmentData ? new Date(enrollmentData.enrollmentDate).toLocaleDateString() : ''}</p>
                      </div>
                      <button
                        onClick={() => alert('Course content access coming soon!')}
                        className="btn btn-success btn-large"
                      >
                        🚀 Start Learning
                      </button>
                      {enrollmentData?.progress?.percentageComplete > 0 && (
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{width: `${enrollmentData.progress.percentageComplete}%`}}
                          ></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      className="btn btn-primary btn-large"
                    >
                      Enroll Now
                    </button>
                  )}
                </>
              ) : (
                <div className="login-prompt">
                  <p>Please log in to enroll in this course</p>
                  <a href="/login" className="btn btn-primary">Log In</a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="course-content">
          <div className="instructor-section">
            <h2>Meet Your Instructor</h2>
            <div className="instructor-card">
              {course.instructor.profilePicture && (
                <img
                  src={course.instructor.profilePicture}
                  alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
                  className="instructor-avatar"
                />
              )}
              <div className="instructor-info">
                <h3>{course.instructor.firstName} {course.instructor.lastName}</h3>
                {course.instructor.bio && (
                  <p>{course.instructor.bio}</p>
                )}
              </div>
            </div>
          </div>

          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="prerequisites-section">
              <h2>Prerequisites</h2>
              <ul>
                {course.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}

          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <div className="outcomes-section">
              <h2>What You'll Learn</h2>
              <ul>
                {course.learningOutcomes.map((outcome, index) => (
                  <li key={index}>{outcome}</li>
                ))}
              </ul>
            </div>
          )}

          {course.syllabus && course.syllabus.length > 0 && (
            <div className="syllabus-section">
              <h2>Course Syllabus</h2>
              <div className="syllabus-list">
                {course.syllabus.map((lesson, index) => (
                  <div key={index} className="syllabus-item">
                    <h4>{lesson.title}</h4>
                    {lesson.description && <p>{lesson.description}</p>}
                    {lesson.duration && <span className="lesson-duration">{lesson.duration} minutes</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.reviews && course.reviews.length > 0 && (
            <div className="reviews-section">
              <h2>Student Reviews</h2>
              <div className="reviews-list">
                {course.reviews.slice(0, 5).map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <strong>{review.user.firstName} {review.user.lastName}</strong>
                      <div className="review-rating">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    {review.comment && <p>{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
