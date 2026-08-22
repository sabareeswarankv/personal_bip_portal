import React from 'react';
import { BookOpen, User, Calendar, Award, CheckCircle, XCircle, PlusCircle, Trash, Edit3 } from 'lucide-react';

export default function Dashboard({ courses, history, onSelectCourse, onToggleCreator, isAdmin, onDeleteCourse, onEditCourse, onDeleteHistory, onExportBackup, onImportBackup, user }) {
  // Calculate profile metrics
  const totalTests = history.length;
  const passedTests = history.filter(h => h.passed).length;
  const avgScore = totalTests > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.percentage, 0) / totalTests) 
    : 0;

  return (
    <div className="w-full px-6 md:px-12 py-8">
      {/* Student Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-16 h-16 rounded-full border border-gray-200 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xl font-bold uppercase border border-blue-200">
              {user?.avatarLetter || 'S'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.name || "Personal PS Student"}</h1>
            <p className="text-gray-500 text-sm">{user?.email || "student@personalps.com"}</p>
            <div className="flex gap-2 mt-1">
              <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Active Learner</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Practice Level 1</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
          <div className="text-center md:text-left">
            <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider">Tests Taken</span>
            <span className="text-2xl font-extrabold text-gray-800">{totalTests}</span>
          </div>
          <div className="text-center md:text-left">
            <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider">Pass Rate</span>
            <span className="text-2xl font-extrabold text-green-600">
              {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
            </span>
          </div>
          <div className="text-center md:text-left">
            <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider">Avg Score</span>
            <span className="text-2xl font-extrabold text-blue-600">{avgScore}%</span>
          </div>
        </div>
      </div>

      {/* Courses List Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="text-blue-600" size={24} />
              My Courses
            </h2>
            <p className="text-gray-500 text-sm">Select any course to view study materials and book tests.</p>
          </div>
          
          {/* Only show Admin Actions if logged in as Admin */}
          {isAdmin && (
            <div className="flex gap-2 flex-wrap justify-end">
              <button 
                onClick={onExportBackup}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3.5 rounded-md transition shadow-sm text-sm"
                title="Download JSON backup of all courses to share with friends"
              >
                Export Backup
              </button>
              
              <label className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-3.5 rounded-md transition shadow-sm text-sm cursor-pointer" title="Import a courses backup JSON file">
                Import Backup
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={onImportBackup}
                />
              </label>

              <button 
                onClick={onToggleCreator}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition shadow-sm text-sm"
              >
                <PlusCircle size={18} />
                Add New Course / Questions
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map(course => (
            <div 
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition hover:-translate-y-0.5"
            >
              {/* Only show Admin Actions if logged in as Admin */}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCourse(course);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition duration-150 hover:scale-105"
                    title="Edit Course / Questions"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCourse(course.id);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md transition duration-150 hover:scale-105"
                    title="Delete Course"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              )}

              <img 
                src={course.banner} 
                alt={course.title}
                className="w-full h-40 object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80";
                }}
              />
              <div className="p-4">
                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider mb-2">
                  {course.type === 'mcq' ? 'MCQ Test' : 'Coding Challenge'}
                </span>
                <h3 className="font-bold text-gray-800 text-base leading-snug mb-1 line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-2">
                  {course.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Practice History Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Award className="text-yellow-500" size={24} />
          Practice History Log
        </h2>

        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p>No practice attempts recorded yet.</p>
            <p className="text-sm">Book a test and complete it to see your stats here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Course Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Result</th>
                  {isAdmin && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {history.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="py-3.5 px-4 text-gray-600">{record.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{record.courseTitle}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium capitalize">{record.type}</td>
                    <td className="py-3.5 px-4 text-center text-gray-800 font-bold">{record.score}</td>
                    <td className="py-3.5 px-4 text-center text-gray-800 font-bold">{record.percentage}%</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center">
                        {record.passed ? (
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                            <CheckCircle size={14} /> Passed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                            <XCircle size={14} /> Failed
                          </span>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistory(index);
                          }}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition duration-150 inline-flex items-center justify-center"
                          title="Delete Attempt History"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
