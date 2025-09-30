import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    minPrice: '',
    maxPrice: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchCourses();
  }, [pagination.page, filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const res = await axios.get(`/api/courses?${params}`);
      setCourses(res.data.data);
      setPagination(prev => ({
        ...prev,
        total: res.data.pagination.total,
        pages: res.data.pagination.pages
      }));
      setError('');
    } catch (err) {
      setError('Failed to fetch courses');
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      level: '',
      minPrice: '',
      maxPrice: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && courses.length === 0) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div className="course-list-page">
      <div className="container">
        <div className="page-header">
          <h1>Explore Courses</h1>
          <p>Discover new skills and advance your career</p>
        </div>

        <div className="filters-section">
          <div className="filters">
            <div className="filter-group">
              <input
                type="text"
                name="search"
                placeholder="Search courses..."
                value={filters.search}
                onChange={handleFilterChange}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
                <option value="Science">Science</option>
                <option value="Language">Language</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="filter-group">
              <select
                name="level"
                value={filters.level}
                onChange={handleFilterChange}
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="filter-group price-filter">
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={handleFilterChange}
                min="0"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                min="0"
              />
            </div>

            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="courses-grid">
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-thumbnail">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="placeholder-thumbnail">
                      <span>📚</span>
                    </div>
                  )}
                </div>

                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p className="course-description">
                    {course.description.substring(0, 100)}...
                  </p>

                  <div className="course-meta">
                    <span className="category">{course.category}</span>
                    <span className="level">{course.level}</span>
                    <span className="duration">{course.duration}h</span>
                  </div>

                  <div className="instructor">
                    By {course.instructor.firstName} {course.instructor.lastName}
                  </div>

                  <div className="course-footer">
                    <div className="price">
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </div>

                    <div className="rating">
                      ⭐ {course.rating.average.toFixed(1)} ({course.rating.count})
                    </div>
                  </div>

                  <Link to={`/courses/${course._id}`} className="btn btn-primary">
                    View Course
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-courses">
              <p>No courses found matching your criteria.</p>
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>

            <span className="page-info">
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
