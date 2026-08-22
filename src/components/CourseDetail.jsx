import React, { useState } from 'react';
import { ChevronLeft, Play, FileText, CheckSquare, Calendar, ChevronRight } from 'lucide-react';

const getEmbedUrl = (url) => {
  if (!url) return "";
  
  // Extract 11-character video ID from any YouTube URL
  let videoId = "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    videoId = match[2];
  } else {
    return url;
  }
  
  // Return the privacy-enhanced nocookie embed URL
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
};

export default function CourseDetail({ course, onBack, onStartAssessment }) {
  const [selectedMaterial, setSelectedMaterial] = useState(course.materials[0] || null);
  const [completedMaterials, setCompletedMaterials] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);

  const durationSeconds = course.assessment?.durationSeconds || 3600;
  const passMarks = course.assessment?.passMarks;
  const questionsCount = course.assessment?.questions?.length || 0;
  const negativeMark = course.assessment?.negativeMark || 0.25;

  const formatDurationText = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs} hour${hrs > 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
    }
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  };

  const toggleMaterialCheckbox = (id) => {
    setCompletedMaterials(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const countCompleted = Object.values(completedMaterials).filter(Boolean).length;

  return (
    <div className="w-full px-6 md:px-12 py-8">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-medium mb-6 transition"
      >
        <ChevronLeft size={20} />
        Back to Dashboard
      </button>

      {/* Course Title Header */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{course.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Video Player & Title (Takes 2 columns in large screens) */}
        <div className="lg:col-span-2">
          {selectedMaterial ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative aspect-video bg-black">
                {selectedMaterial.type === 'video' ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={getEmbedUrl(selectedMaterial.url)} 
                    title={selectedMaterial.title}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white p-8">
                    <FileText size={64} className="text-blue-400 mb-4" />
                    <p className="font-semibold text-lg">{selectedMaterial.title}</p>
                    <p className="text-gray-400 text-sm mt-2">Study Materials for practice</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-lg">{selectedMaterial.title}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleMaterialCheckbox(selectedMaterial.id)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded font-semibold transition border ${
                      completedMaterials[selectedMaterial.id]
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {completedMaterials[selectedMaterial.id] ? 'Completed!' : 'Mark Completed'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center border border-dashed border-gray-300">
              <p className="text-gray-500">No learning materials added yet.</p>
            </div>
          )}
        </div>

        {/* Right Column: Details, Slot Booking & Syllabus Checklist */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Course Info & Book Slot */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Course Details</h3>
            <p className="text-lg font-bold text-gray-800 mb-4">{course.title}</p>
            
            <button 
              onClick={() => setShowBookingModal(true)}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3 px-4 rounded-md transition shadow-md flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Book a Slot
            </button>
          </div>

          {/* Card 2: Materials Checklist */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Course Materials</h3>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Materials: {countCompleted} / {course.materials.length}
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {course.materials.map((mat, idx) => (
                <div 
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedMaterial?.id === mat.id
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={!!completedMaterials[mat.id]}
                    onChange={() => toggleMaterialCheckbox(mat.id)}
                    onClick={(e) => e.stopPropagation()} // Prevent selecting the video tab when ticking checkbox
                    className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold text-gray-800 truncate`}>{mat.title}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{mat.type}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 self-center" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Booking Slot Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Book Slot & Start Test</h3>
            <p className="text-gray-500 text-sm mb-6">
              You are about to launch the **{course.title}** assessment. 
              Under mock conditions, booking a slot lands you directly into the test environment.
            </p>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-xs leading-relaxed mb-6 border border-blue-100">
              <strong>Rules:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>You will have <strong>{formatDurationText(durationSeconds)}</strong> to finish the test.</li>
                {course.type === 'mcq' ? (
                  <>
                    <li>There are <strong>{questionsCount} questions</strong>.</li>
                    <li>Incorrect answers incur a <strong>-{negativeMark} penalty</strong>.</li>
                    <li>Passing mark is <strong>{passMarks || 24}</strong>.</li>
                  </>
                ) : (
                  <>
                    <li>Coding problems require solving within Monaco IDE.</li>
                    <li>Each problem runs against sample and 5 hidden test cases.</li>
                    <li>Passing mark is <strong>{passMarks || 48}</strong>.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowBookingModal(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-md transition text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowBookingModal(false);
                  onStartAssessment();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-md transition shadow-md text-sm"
              >
                Enter Assessment Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
