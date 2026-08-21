import React, { useState, useEffect } from 'react';
import { Timer, AlertTriangle, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';

export default function McqTest({ course, onFinishTest, onExit }) {
  const { questions, durationSeconds, passMarks, negativeMark } = course.assessment;
  
  // Test State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Timer Effect
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) {
      if (timeLeft <= 0 && !isSubmitted) {
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  // Format Time (HH:MM:SS)
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIdx) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questions[currentIdx].id]: optIdx
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    // Calculate Marks
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    questions.forEach(q => {
      const selected = answers[q.id];
      if (selected === undefined || selected === null) {
        unattempted++;
      } else if (selected === q.correctIndex) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const score = correct - (incorrect * negativeMark);
    const finalScore = parseFloat(score.toFixed(2));
    const percentage = Math.round((finalScore / questions.length) * 100);
    const passed = finalScore >= passMarks;

    const result = {
      score: `${finalScore} / ${questions.length}`,
      percentage: percentage,
      correct: correct,
      incorrect: incorrect,
      unattempted: unattempted,
      passed: passed,
      timeSpent: formatTime(durationSeconds - timeLeft)
    };

    setTestResult(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-800 text-lg">{course.title} - Assessment</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Box */}
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-md font-mono text-gray-700">
            <Timer size={18} className="text-gray-500" />
            <span className="font-bold text-base">{formatTime(timeLeft)}</span>
          </div>

          {/* Finish Test Box right after the timer */}
          {!isSubmitted && (
            <button 
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded shadow transition text-sm uppercase tracking-wider"
            >
              Finish Test
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className={`flex-1 w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 ${isSubmitted ? 'pointer-events-none select-none opacity-60' : ''}`}>
        
        {/* Left Panel: 40 Questions Grid (1 Column) - Pushed to bottom on mobile */}
        <div className="order-last lg:order-first bg-white border border-gray-200 rounded-lg p-5 shadow-sm h-fit">
          <h3 className="font-bold text-gray-700 text-sm border-b border-gray-100 pb-3 mb-4">
            Question Status Grid
          </h3>
          
          {/* Color Indicators Legend */}
          <div className="flex gap-4 text-xs font-semibold text-gray-500 mb-4 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200 inline-block"></span>
              <span>Unanswered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-green-500 inline-block"></span>
              <span>Answered</span>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const hasAnswer = answers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-10 h-10 rounded font-semibold text-xs transition border flex items-center justify-center ${
                    idx === currentIdx 
                      ? 'ring-2 ring-blue-500 ring-offset-1 border-transparent' 
                      : ''
                  } ${
                    hasAnswer 
                      ? 'bg-green-500 text-white border-transparent' 
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Question text & 6 Options (3 Columns) - Loaded first on mobile */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-first lg:order-last">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex-1 flex flex-col justify-between min-h-[450px]">
              <div>
                {/* Question Header */}
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-4">
                  <span>QUESTION {currentIdx + 1} OF {questions.length}</span>
                  <span className="text-red-500">-0.25 NEGATIVE MARKING</span>
                </div>
                
                {/* Question Body */}
                <h4 className="text-lg font-bold text-gray-800 leading-relaxed mb-8">
                  {questions[currentIdx].text}
                </h4>

                {/* 6 Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questions[currentIdx].options.map((option, oIdx) => {
                    const isSelected = answers[questions[currentIdx].id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(oIdx)}
                        className={`flex items-center text-left p-4 rounded-lg border text-sm transition ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-800 font-semibold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold mr-3 bg-white shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Big Next Button below options */}
                <button
                  onClick={handleNext}
                  disabled={currentIdx === questions.length - 1}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-6 rounded-lg shadow-md transition disabled:opacity-50 text-base uppercase tracking-wider"
                >
                  Next Question
                </button>
              </div>

              {/* Navigation Footer */}
              <div className="flex justify-between border-t border-gray-100 pt-6 mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="px-5 py-2 border border-gray-300 rounded font-semibold text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                >
                  Previous Question
                </button>
                <span className="text-xs text-gray-400 font-bold self-center">
                  Pass Mark: 24/40
                </span>
              </div>
            </div>
          </div>

      </div>

      {/* Centered Results Modal Box */}
      {isSubmitted && testResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-gray-100 text-center animate-scaleUp">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Test Completed</h3>
            <p className="text-gray-500 text-xs mb-6 uppercase tracking-wider">Final Marks Obtained</p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl py-6 mb-6">
              <span className="text-3xl font-black text-blue-600 block">
                {testResult.score}
              </span>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1 block">
                {testResult.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            
            <button
              onClick={() => onFinishTest(testResult)}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3 rounded-lg transition shadow-md text-sm"
            >
              Go back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Pre-submit Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Test Submission</h3>
            <p className="text-sm text-gray-500 mb-6">
              You have answered <strong className="text-green-600">{Object.keys(answers).length}</strong> questions and left <strong className="text-red-500">{questions.length - Object.keys(answers).length}</strong> unanswered.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-md transition text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-md transition shadow-md text-sm"
              >
                Finish Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
