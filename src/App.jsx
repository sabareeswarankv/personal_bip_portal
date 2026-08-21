import React, { useState, useEffect } from 'react';
import { initialCourses } from './data/coursesData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import McqTest from './components/McqTest';
import CodingTest from './components/CodingTest';
import CreatorMode from './components/CreatorMode';
import { BookOpen } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [logoTaps, setLogoTaps] = useState(0);
  // Navigation states: 'dashboard' | 'course-detail' | 'mcq-test' | 'coding-test' | 'creator-mode'
  const [view, setView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Reset tap counter after 2 seconds of inactivity
  useEffect(() => {
    if (logoTaps > 0) {
      const timer = setTimeout(() => setLogoTaps(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [logoTaps]);

  // Dynamic collections synced with localStorage
  const [courses, setCourses] = useState([]);
  const [history, setHistory] = useState([]);

  // Load initial settings
  useEffect(() => {
    // 1. Fetch courses
    const savedCourses = localStorage.getItem('personal_ps_assessment_courses');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    } else {
      localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(initialCourses));
      setCourses(initialCourses);
    }

    // 2. Fetch history
    const savedHistory = localStorage.getItem('personal_ps_assessment_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // 3. Secret Admin Listener
    let typed = "";
    const handleKeyDown = (e) => {
      if (e.key.length === 1) {
        typed += e.key.toLowerCase();
        // Expand buffer size to handle longer keywords
        if (typed.length > 60) {
          typed = typed.slice(-40);
        }
        
        if (typed.endsWith("openpersonaladminaccount")) {
          setIsAdmin(true);
          alert("Admin Mode: Activated");
          typed = ""; // Reset buffer
        } else if (typed.endsWith("closepersonaladminaccount")) {
          setIsAdmin(false);
          alert("Admin Mode: Deactivated");
          typed = ""; // Reset buffer
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save new course
  const handleSaveCourse = (newCourse) => {
    const updatedCourses = [newCourse, ...courses];
    setCourses(updatedCourses);
    localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(updatedCourses));
  };

  // Update existing course
  const handleUpdateCourse = (updatedCourse) => {
    const updated = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
    setCourses(updated);
    localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(updated));
    setEditingCourse(null);
  };

  // Edit course click handler
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setView('creator-mode');
  };

  // Delete course
  const handleDeleteCourse = (courseId) => {
    if (window.confirm("Are you sure you want to delete this course and all its questions?")) {
      const updated = courses.filter(c => c.id !== courseId);
      setCourses(updated);
      localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(updated));

      // Clean history for deleted course
      const courseTitle = courses.find(c => c.id === courseId)?.title;
      if (courseTitle) {
        const updatedHistory = history.filter(h => h.courseTitle !== courseTitle);
        setHistory(updatedHistory);
        localStorage.setItem('personal_ps_assessment_history', JSON.stringify(updatedHistory));
      }
    }
  };

  // Select course
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setView('course-detail');
  };

  // Launch assessment
  const handleStartAssessment = () => {
    if (selectedCourse.type === 'mcq') {
      setView('mcq-test');
    } else {
      setView('coding-test');
    }
  };

  // Finish exam & log results
  const handleFinishTest = (result) => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const newRecord = {
      date: formattedDate,
      courseTitle: selectedCourse.title,
      type: selectedCourse.type,
      score: result.score,
      percentage: result.percentage,
      passed: result.passed
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('personal_ps_assessment_history', JSON.stringify(updatedHistory));

    // Return to dashboard
    setView('dashboard');
    setSelectedCourse(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      
      {/* Top Banner (Visible in Dashboard/Detail views) */}
      {(view === 'dashboard' || view === 'course-detail' || view === 'creator-mode') && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none" 
            onClick={() => {
              setLogoTaps(prev => {
                const next = prev + 1;
                if (next >= 5) {
                  setIsAdmin(curr => {
                    const nextState = !curr;
                    alert(nextState ? "Admin Mode: Activated" : "Admin Mode: Deactivated");
                    return nextState;
                  });
                  return 0;
                }
                return next;
              });
              setView('dashboard');
            }}
          >
            <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              PS
            </div>
            <div>
              <span className="font-extrabold text-gray-800 text-sm tracking-tight block">Personal PS Assessment</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block -mt-0.5">Practice Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 bg-white">
            <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded border border-blue-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Practice Mode Enabled
            </span>
            <button 
              onClick={() => setUser(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-1.5 px-3 rounded border border-gray-200 transition"
            >
              Sign Out
            </button>
          </div>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {view === 'dashboard' && (
          <Dashboard 
            courses={courses} 
            history={history} 
            isAdmin={isAdmin}
            user={user}
            onSelectCourse={handleSelectCourse} 
            onToggleCreator={() => setView('creator-mode')}
            onDeleteCourse={handleDeleteCourse}
            onEditCourse={handleEditCourse}
          />
        )}

        {view === 'course-detail' && (
          <CourseDetail 
            course={selectedCourse} 
            onBack={() => setView('dashboard')} 
            onStartAssessment={handleStartAssessment}
          />
        )}

        {view === 'mcq-test' && (
          <McqTest 
            course={selectedCourse} 
            onFinishTest={handleFinishTest}
            onExit={() => setView('dashboard')}
          />
        )}

        {view === 'coding-test' && (
          <CodingTest 
            course={selectedCourse} 
            onFinishTest={handleFinishTest}
            onExit={() => setView('dashboard')}
          />
        )}

        {view === 'creator-mode' && (
          <CreatorMode 
            onBack={() => {
              setEditingCourse(null);
              setView('dashboard');
            }} 
            onSaveCourse={handleSaveCourse}
            onUpdateCourse={handleUpdateCourse}
            editingCourse={editingCourse}
          />
        )}
      </main>

      {/* Footer (Visible in Dashboard/Detail views) */}
      {(view === 'dashboard' || view === 'course-detail' || view === 'creator-mode') && (
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400 font-semibold uppercase tracking-wider">
          © {new Date().getFullYear()} Personal PS Assessment. Built for Practice.
        </footer>
      )}
    </div>
  );
}
