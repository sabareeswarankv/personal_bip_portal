import React, { useState, useEffect } from 'react';
import { initialCourses } from './data/coursesData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import McqTest from './components/McqTest';
import CodingTest from './components/CodingTest';
import CreatorMode from './components/CreatorMode';
import { db, isConfigured } from './utils/firebase';
import { collection, onSnapshot, setDoc, doc, deleteDoc, addDoc, query, where } from 'firebase/firestore';

export default function App() {
  // Sync state instantly with localStorage to prevent blank states on refresh/back navigation
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('personal_ps_assessment_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('personal_ps_assessment_courses');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(initialCourses));
    return initialCourses;
  });
  
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('personal_ps_assessment_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Real-time courses sync from Firebase
  useEffect(() => {
    if (!isConfigured || !db) return;

    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      
      if (list.length === 0) {
        // Auto-seed Firebase database with initial courses on first launch
        initialCourses.forEach(async (c) => {
          await setDoc(doc(db, "courses", c.id), c);
        });
      } else {
        // Sort courses by title or keep order
        setCourses(list);
        localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(list));
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time student history sync from Firebase
  useEffect(() => {
    if (!isConfigured || !db || !user?.email) {
      const saved = localStorage.getItem('personal_ps_assessment_history');
      setHistory(saved ? JSON.parse(saved) : []);
      return;
    }

    const q = query(collection(db, "history"), where("userEmail", "==", user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ docId: doc.id, ...doc.data() });
      });
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(list);
      localStorage.setItem('personal_ps_assessment_history', JSON.stringify(list));
    });

    return () => unsubscribe();
  }, [user]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [view, setView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Sync route on initial load and when hash changes (resolves browser & mobile back button)
  useEffect(() => {
    const syncRouteFromHash = () => {
      const hash = window.location.hash;
      
      if (!hash || hash === '#/' || hash === '#/dashboard') {
        setView('dashboard');
        setIsAdmin(false); // student mode
        setSelectedCourse(null);
      } else if (hash === '#/admin') {
        if (isAdmin) {
          setView('dashboard');
          setSelectedCourse(null);
        } else {
          const accessCode = window.prompt("Enter Admin Access Code to continue:");
          if (accessCode === "personaladminportal") {
            setView('dashboard');
            setIsAdmin(true); // admin mode!
            setSelectedCourse(null);
          } else {
            if (accessCode !== null) {
              alert("Access Denied: Invalid Access Code.");
            }
            window.location.hash = '#/dashboard';
          }
        }
      } else if (hash === '#/creator-mode') {
        setView('creator-mode');
      } else if (hash.startsWith('#/course-detail/')) {
        const courseId = hash.replace('#/course-detail/', '');
        const found = courses.find(c => c.id === courseId);
        if (found) {
          setSelectedCourse(found);
          setView('course-detail');
        } else {
          window.location.hash = '#/dashboard';
        }
      } else if (hash.startsWith('#/mcq-test/')) {
        const courseId = hash.replace('#/mcq-test/', '');
        const found = courses.find(c => c.id === courseId);
        if (found) {
          setSelectedCourse(found);
          setView('mcq-test');
        } else {
          window.location.hash = '#/dashboard';
        }
      } else if (hash.startsWith('#/coding-test/')) {
        const courseId = hash.replace('#/coding-test/', '');
        const found = courses.find(c => c.id === courseId);
        if (found) {
          setSelectedCourse(found);
          setView('coding-test');
        } else {
          window.location.hash = '#/dashboard';
        }
      }
    };

    window.addEventListener('hashchange', syncRouteFromHash);
    syncRouteFromHash(); // run once on start

    return () => window.removeEventListener('hashchange', syncRouteFromHash);
  }, [courses]);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    localStorage.setItem('personal_ps_assessment_user', JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('personal_ps_assessment_user');
    window.location.hash = '#/dashboard';
  };

  // Save new course
  const handleSaveCourse = async (newCourse) => {
    if (isConfigured && db) {
      await setDoc(doc(db, "courses", newCourse.id), newCourse);
    } else {
      const updatedCourses = [newCourse, ...courses];
      setCourses(updatedCourses);
      localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(updatedCourses));
    }
  };

  // Update existing course
  const handleUpdateCourse = async (updatedCourse) => {
    if (isConfigured && db) {
      await setDoc(doc(db, "courses", updatedCourse.id), updatedCourse);
    } else {
      const updated = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      setCourses(updated);
      localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(updated));
    }
    setEditingCourse(null);
  };

  // Edit course click handler
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    window.location.hash = '#/creator-mode';
  };

  // Delete course
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course and all its questions?")) {
      if (isConfigured && db) {
        await deleteDoc(doc(db, "courses", courseId));
      } else {
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
    }
  };

  const handleDeleteHistory = async (recordIndex) => {
    if (window.confirm("Are you sure you want to delete this practice attempt log?")) {
      const record = history[recordIndex];
      if (isConfigured && db && record?.docId) {
        await deleteDoc(doc(db, "history", record.docId));
      } else {
        const updated = history.filter((_, idx) => idx !== recordIndex);
        setHistory(updated);
        localStorage.setItem('personal_ps_assessment_history', JSON.stringify(updated));
      }
    }
  };

  const handleExportBackup = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(courses, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", "personal_ps_courses_backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Export backup failed: " + e.message);
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) {
          alert("Invalid backup format: JSON must be an array of courses.");
          return;
        }

        const isValid = parsed.every(c => c.id && c.title && c.type && c.assessment);
        if (!isValid) {
          alert("Invalid backup format: Each course must have 'id', 'title', 'type', and 'assessment'.");
          return;
        }

        if (window.confirm(`Are you sure you want to import ${parsed.length} courses? This will overwrite your current course list.`)) {
          if (isConfigured && db) {
            for (const c of parsed) {
              await setDoc(doc(db, "courses", c.id), c);
            }
          } else {
            setCourses(parsed);
            localStorage.setItem('personal_ps_assessment_courses', JSON.stringify(parsed));
          }
          alert("Backup imported successfully!");
        }
      } catch (error) {
        alert("Import failed: " + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSelectCourse = (course) => {
    window.location.hash = `#/course-detail/${course.id}`;
  };

  const handleStartAssessment = () => {
    localStorage.removeItem(`personal_ps_active_mcq_test_${selectedCourse.id}`);
    localStorage.removeItem(`personal_ps_active_coding_test_${selectedCourse.id}`);
    window.location.hash = `#/${selectedCourse.type}-test/${selectedCourse.id}`;
  };

  // Finish exam & log results
  const handleFinishTest = async (result) => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const newRecord = {
      date: formattedDate,
      courseTitle: selectedCourse.title,
      type: selectedCourse.type,
      score: result.score,
      percentage: result.percentage,
      passed: result.passed,
      userEmail: user?.email || "student@personalps.com"
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "history"), newRecord);
    } else {
      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('personal_ps_assessment_history', JSON.stringify(updatedHistory));
    }

    // Return to dashboard hash
    window.location.hash = '#/dashboard';
  };

  // Logo click handler
  const handleLogoClick = () => {
    window.location.hash = '#/dashboard';
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      
      {/* Top Banner (Visible in Dashboard/Detail/Creator views) */}
      {(view === 'dashboard' || view === 'course-detail' || view === 'creator-mode') && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={handleLogoClick}>
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
              onClick={handleLogout}
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
            onToggleCreator={() => { window.location.hash = '#/creator-mode'; }}
            onDeleteCourse={handleDeleteCourse}
            onEditCourse={handleEditCourse}
            onDeleteHistory={handleDeleteHistory}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {view === 'course-detail' && (
          <CourseDetail 
            course={selectedCourse} 
            onBack={() => { window.location.hash = '#/dashboard'; }} 
            onStartAssessment={handleStartAssessment}
          />
        )}

        {view === 'mcq-test' && (
          <McqTest 
            course={selectedCourse} 
            onFinishTest={handleFinishTest}
            onExit={() => { window.location.hash = '#/dashboard'; }}
          />
        )}

        {view === 'coding-test' && (
          <CodingTest 
            course={selectedCourse} 
            onFinishTest={handleFinishTest}
            onExit={() => { window.location.hash = '#/dashboard'; }}
          />
        )}

        {view === 'creator-mode' && (
          <CreatorMode 
            onBack={() => {
              setEditingCourse(null);
              window.location.hash = isAdmin ? '#/admin' : '#/dashboard';
            }} 
            onSaveCourse={handleSaveCourse}
            onUpdateCourse={handleUpdateCourse}
            editingCourse={editingCourse}
          />
        )}
      </main>

      {/* Footer (Visible in Dashboard/Detail/Creator views) */}
      {(view === 'dashboard' || view === 'course-detail' || view === 'creator-mode') && (
        <footer className="bg-white border-t border-gray-200 py-6 px-6 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Personal PS Assessment. Built for training preparation.</p>
        </footer>
      )}
    </div>
  );
}
