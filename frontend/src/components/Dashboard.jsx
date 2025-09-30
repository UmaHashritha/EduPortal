import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    overallProgress: 0,
    createdCourses: 0
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('=== DASHBOARD DEBUG ===');
      console.log('Fetching enrollments for user:', user.id);

      // Fetch user's enrollments
      const enrollmentRes = await axios.get('/api/enrollments');
      console.log('Enrollment response:', enrollmentRes.data);

      const enrollmentData = enrollmentRes.data.data || [];
      setEnrollments(enrollmentData);

      // Calculate stats
      const activeEnrollments = enrollmentData.filter(e => e.status === 'active');
      const completedEnrollments = enrollmentData.filter(e => e.status === 'completed');
      const totalProgress = enrollmentData.reduce((sum, e) => sum + (e.progress?.percentageComplete || 0), 0);
      const averageProgress = enrollmentData.length > 0 ? Math.round(totalProgress / enrollmentData.length) : 0;

      setStats({
        enrolledCourses: activeEnrollments.length,
        completedCourses: completedEnrollments.length,
        overallProgress: averageProgress,
        createdCourses: user.createdCourses?.length || 0
      });

      setError('');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    navigate('/create-course');
  };

  const handleManageCourses = () => {
    // This will be implemented later
    alert('Manage Courses feature coming soon!');
  };

  const handleViewAnalytics = () => {
    // This will be implemented later
    alert('Analytics feature coming soon!');
  };

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (authLoading || loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!isAuthenticated) {
    return <div className="error">Please log in to access your dashboard.</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome to Your Dashboard, {user?.firstName}!</h1>
          <p>Manage your learning journey from here.</p>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Enrolled Courses</h3>
              <p className="stat-number">{stats.enrolledCourses}</p>
              <p className="stat-desc">Active enrollments</p>
            </div>

            <div className="stat-card">
              <h3>Completed Courses</h3>
              <p className="stat-number">{stats.completedCourses}</p>
              <p className="stat-desc">Certificates earned</p>
            </div>

            <div className="stat-card">
              <h3>Learning Progress</h3>
              <p className="stat-number">{stats.overallProgress}%</p>
              <p className="stat-desc">Overall completion</p>
            </div>

            {user?.role === 'instructor' && (
              <div className="stat-card">
                <h3>Created Courses</h3>
                <p className="stat-number">{stats.createdCourses}</p>
                <p className="stat-desc">Your courses</p>
              </div>
            )}
          </div>

          <div className="dashboard-sections">
            <section className="dashboard-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                <p className="no-activity">No recent activity to show.</p>
              </div>
            </section>

            <section className="dashboard-section">
              <h2>Your Courses</h2>
              <div className="course-list">
                {enrollments.length > 0 ? (
                  <div className="enrolled-courses">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment._id} className="course-card">
                        <div className="course-info">
                          <h3>{enrollment.course?.title || 'Course Title'}</h3>
                          <p>{enrollment.course?.description || 'No description available'}</p>
                          <div className="course-meta">
                            <span className="enrollment-status">
                              Status: <strong>{enrollment.status}</strong>
                            </span>
                            <span className="progress">
                              Progress: <strong>{enrollment.progress?.percentageComplete || 0}%</strong>
                            </span>
                            <span className="enrolled-date">
                              Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="course-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleCourseClick(enrollment.course?._id)}
                          >
                            {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-courses">
                    You haven't enrolled in any courses yet.{' '}
                    <a href="/courses">Browse available courses</a>
                  </p>
                )}
              </div>
            </section>

            {user?.role === 'instructor' && (
              <section className="dashboard-section">
                <h2>Instructor Panel</h2>
                <div className="instructor-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateCourse}
                  >
                    Create New Course
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleManageCourses}
                  >
                    Manage Courses
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleViewAnalytics}
                  >
                    View Analytics
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
