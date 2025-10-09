"use client";
import { useState, useEffect } from "react";

export const CourseDropdown = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data.courses || []);
      if (data.courses && data.courses.length > 0) {
        setSelectedCourse(data.courses[0].id);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    setIsOpen(false);
  };

  const selectedCourseData = courses.find(course => course.id === selectedCourse);

  if (loading) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <div className="bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600/30 p-3 backdrop-blur-md rounded-lg border-slate-100/30 border">
          <div className="text-white/70 text-sm">Loading courses...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <div className="bg-gradient-to-tr from-red-300/30 via-red-400/30 to-red-600/30 p-3 backdrop-blur-md rounded-lg border-red-100/30 border">
          <div className="text-white/70 text-sm">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600/30 p-3 backdrop-blur-md rounded-lg border-slate-100/30 border hover:from-slate-300/40 hover:via-gray-400/40 hover:to-slate-600/40 transition-all duration-200 flex items-center gap-2 min-w-[200px]"
        >
          <div className="flex-1 text-left">
            <div className="text-white font-medium text-sm">
              {selectedCourseData ? selectedCourseData.name : 'Select Course'}
            </div>
            {selectedCourseData && (
              <div className="text-white/60 text-xs">
                {selectedCourseData.description}
              </div>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-gradient-to-tr from-slate-300/90 via-gray-400/90 to-slate-600/90 backdrop-blur-md rounded-lg border-slate-100/30 border shadow-lg">
            <div className="py-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseSelect(course.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors duration-150 ${
                    selectedCourse === course.id ? 'bg-white/20' : ''
                  }`}
                >
                  <div className="text-white font-medium text-sm">{course.name}</div>
                  <div className="text-white/60 text-xs">{course.description}</div>
                  {course.level && (
                    <div className="text-white/50 text-xs mt-1">Level: {course.level}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
