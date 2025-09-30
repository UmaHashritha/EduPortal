import React, { useState } from 'react';

const CourseContentBuilder = ({ modules, onChange }) => {
  const [expandedModule, setExpandedModule] = useState(null);

  const addModule = () => {
    const newModule = {
      id: Date.now().toString(),
      title: '',
      description: '',
      lessons: []
    };
    onChange([...modules, newModule]);
    // Auto-expand the new module
    setExpandedModule(newModule.id);
  };

  const updateModule = (moduleId, field, value) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId ? { ...module, [field]: value } : module
    );
    onChange(updatedModules);
  };

  const deleteModule = (moduleId) => {
    const updatedModules = modules.filter(module => module.id !== moduleId);
    onChange(updatedModules);
    setExpandedModule(null);
  };

  const addLesson = (moduleId) => {
    const newLesson = {
      id: Date.now().toString(),
      title: '',
      type: 'video', // video, text, document, quiz
      content: '',
      duration: 0,
      resources: []
    };

    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    );
    onChange(updatedModules);
  };

  const updateLesson = (moduleId, lessonId, field, value) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
            )
          }
        : module
    );
    onChange(updatedModules);
  };

  const deleteLesson = (moduleId, lessonId) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
          }
        : module
    );
    onChange(updatedModules);
  };

  const handleFileUpload = (moduleId, lessonId, file) => {
    // In a real implementation, this would upload to a cloud storage service
    // For now, we'll just store the file info
    const fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    };

    updateLesson(moduleId, lessonId, 'content', fileInfo.url);

    // Add to resources
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId
                ? { ...lesson, resources: [...(lesson.resources || []), fileInfo] }
                : lesson
            )
          }
        : module
    );
    onChange(updatedModules);

    // Show confirmation
    console.log(`File "${file.name}" uploaded successfully!`, fileInfo);
  };

  return (
    <div className="course-content-builder">
      <div className="content-builder-header">
        <h2>Course Content</h2>
        <p>Build your course with modules and lessons. Start by clicking "Add Module" below.</p>
      </div>

      {modules.length === 0 && (
        <div className="getting-started">
          <div className="no-modules">
            <h3>🎬 Ready to build your course?</h3>
            <p>Let's start by creating your first module!</p>
            <ol style={{ textAlign: 'left', margin: '20px 0' }}>
              <li>Click "Add Module" to create a course section</li>
              <li>Add a title and description for your module</li>
              <li>Click "Expand" and then "Add Lesson" to create lessons</li>
              <li>Choose content type: Video, Text, Document, or Quiz</li>
              <li>Upload your content or paste URLs</li>
            </ol>
          </div>
        </div>
      )}

      <div className="modules-list">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="module-item">
            <div className="module-header">
              <div className="module-info">
                <input
                  type="text"
                  placeholder={`Module ${moduleIndex + 1} Title (e.g., "Introduction to React")`}
                  value={module.title}
                  onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                  className="module-title-input"
                />
                <textarea
                  placeholder="Module Description (e.g., Learn the basics of React components and JSX)"
                  value={module.description}
                  onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                  className="module-description-input"
                  rows="2"
                />
              </div>
              <div className="module-actions">
                <button
                  type="button"
                  onClick={() => setExpandedModule(
                    expandedModule === module.id ? null : module.id
                  )}
                  className="btn btn-secondary btn-sm"
                >
                  {expandedModule === module.id ? '▼ Collapse' : '▶ Expand'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteModule(module.id)}
                  className="btn btn-danger btn-sm"
                >
                  🗑 Delete
                </button>
              </div>
            </div>

            {expandedModule === module.id && (
              <div className="module-content">
                <div className="lessons-section">
                  <div className="lessons-header">
                    <h4>📚 Lessons in this Module</h4>
                    <button
                      type="button"
                      onClick={() => addLesson(module.id)}
                      className="btn btn-primary btn-sm"
                    >
                      ➕ Add Lesson
                    </button>
                  </div>

                  <div className="lessons-list">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="lesson-item">
                        <div className="lesson-header">
                          <input
                            type="text"
                            placeholder={`Lesson ${lessonIndex + 1} Title (e.g., "What is a Component?")`}
                            value={lesson.title}
                            onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                            className="lesson-title-input"
                          />
                          <div className="lesson-controls">
                            <select
                              value={lesson.type}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'type', e.target.value)}
                              className="lesson-type-select"
                            >
                              <option value="video">📹 Video</option>
                              <option value="text">📝 Text/Article</option>
                              <option value="document">📄 Document</option>
                              <option value="quiz">🧪 Quiz</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Duration (min)"
                              value={lesson.duration}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'duration', parseInt(e.target.value) || 0)}
                              className="lesson-duration-input"
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => deleteLesson(module.id, lesson.id)}
                              className="btn btn-danger btn-sm"
                              title="Delete this lesson"
                            >
                              ❌
                            </button>
                          </div>
                        </div>

                        <div className="lesson-content">
                          {lesson.type === 'video' && (
                            <div className="video-upload">
                              <div className="upload-section">
                                <label className="upload-label">📹 Upload Video File:</label>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleFileUpload(module.id, lesson.id, e.target.files[0]);
                                    }
                                  }}
                                  className="file-input"
                                />
                                <p className="upload-help">Supports: MP4, MOV, AVI, etc.</p>
                              </div>

                              <div className="url-section">
                                <label className="upload-label">🔗 Or paste video URL:</label>
                                <input
                                  type="url"
                                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                                  value={lesson.content}
                                  onChange={(e) => updateLesson(module.id, lesson.id, 'content', e.target.value)}
                                  className="video-url-input"
                                />
                                <p className="upload-help">YouTube, Vimeo, or direct video links</p>
                              </div>

                              {lesson.resources.length > 0 && (
                                <div className="uploaded-files">
                                  <h5>✅ Uploaded Video:</h5>
                                  {lesson.resources.map((resource, index) => (
                                    <div key={index} className="file-item">
                                      <span>📹 {resource.name}</span>
                                      <span className="file-size">({(resource.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {lesson.type === 'text' && (
                            <div className="text-content">
                              <label className="upload-label">📝 Write your lesson content:</label>
                              <textarea
                                placeholder="Write your lesson content here... You can include explanations, code examples, exercises, etc."
                                value={lesson.content}
                                onChange={(e) => updateLesson(module.id, lesson.id, 'content', e.target.value)}
                                className="lesson-text-content"
                                rows="8"
                              />
                              <p className="content-help">💡 You can use Markdown formatting (* for bold, ** for italic, etc.)</p>
                            </div>
                          )}

                          {lesson.type === 'document' && (
                            <div className="document-upload">
                              <label className="upload-label">📄 Upload Document:</label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleFileUpload(module.id, lesson.id, e.target.files[0]);
                                  }
                                }}
                                className="file-input"
                              />
                              <p className="upload-help">📎 Supports: PDF, Word, PowerPoint, Text files</p>

                              {lesson.resources.length > 0 && (
                                <div className="uploaded-files">
                                  <h5>✅ Uploaded Documents:</h5>
                                  {lesson.resources.map((resource, index) => (
                                    <div key={index} className="file-item">
                                      <span>📄 {resource.name}</span>
                                      <span className="file-size">({(resource.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {lesson.type === 'quiz' && (
                            <div className="quiz-builder">
                              <label className="upload-label">🧪 Create Quiz:</label>
                              <textarea
                                placeholder="Quiz Instructions and Questions:&#10;&#10;Example:&#10;Question 1: What is React?&#10;A) A library&#10;B) A framework&#10;C) A language&#10;Answer: A&#10;&#10;Question 2: JSX stands for?&#10;A) JavaScript XML&#10;B) Java Syntax Extension&#10;Answer: A"
                                value={lesson.content}
                                onChange={(e) => updateLesson(module.id, lesson.id, 'content', e.target.value)}
                                className="quiz-content"
                                rows="6"
                              />
                              <p className="content-help">🚀 Advanced quiz builder with multiple choice, drag-drop, and auto-grading coming soon!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {module.lessons.length === 0 && (
                      <div className="no-lessons">
                        <p>📚 No lessons yet. Click "Add Lesson" above to create your first lesson!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="content-builder-actions">
        <button
          type="button"
          onClick={addModule}
          className="btn btn-primary btn-large"
        >
          ➕ Add Module
        </button>
      </div>
    </div>
  );
};

export default CourseContentBuilder;
