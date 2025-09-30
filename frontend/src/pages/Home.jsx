import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Our Learning Management System</h1>
          <p>
            Discover, learn, and grow with our comprehensive online courses.
            Join thousands of students and instructors in our learning community.
          </p>

          {isAuthenticated ? (
            <div className="hero-actions">
              <h2>Welcome back, {user?.firstName}!</h2>
              <div className="action-buttons">
                <Link to="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
                <Link to="/courses" className="btn btn-secondary">
                  Browse Courses
                </Link>
              </div>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/courses" className="btn btn-secondary">
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose Our Platform?</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>Expert Instructors</h3>
              <p>Learn from industry professionals and experienced educators.</p>
            </div>
            <div className="feature">
              <h3>Flexible Learning</h3>
              <p>Study at your own pace with 24/7 access to course materials.</p>
            </div>
            <div className="feature">
              <h3>Progress Tracking</h3>
              <p>Monitor your learning progress and earn certificates upon completion.</p>
            </div>
            <div className="feature">
              <h3>Community Support</h3>
              <p>Connect with fellow learners and get help when you need it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Ready to Start Learning?</h2>
          <p>Join our community of learners today and unlock your potential.</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary">
              Sign Up Now
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
