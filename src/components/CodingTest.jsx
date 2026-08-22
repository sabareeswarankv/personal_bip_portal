import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { LANGUAGES, runCodeOnJudge0 } from '../utils/compiler';
import { Timer, Play, CheckCircle, XCircle, ChevronRight, Terminal, RefreshCw, ChevronLeft } from 'lucide-react';

export default function CodingTest({ course, onFinishTest, onExit }) {
  const { questions, durationSeconds, passMarks } = course.assessment;

  // Active coding question
  // Active coding question
  const [activeQnIdx, setActiveQnIdx] = useState(() => {
    const saved = localStorage.getItem(`personal_ps_active_coding_test_${course.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Number(parsed.durationSeconds) === Number(durationSeconds) && Number(parsed.passMarks) === Number(passMarks)) {
        return parsed.activeQnIdx !== undefined ? parsed.activeQnIdx : 0;
      }
    }
    return 0;
  });
  const activeQn = questions[activeQnIdx];

  // Editor states (stores code per question index)
  const [codes, setCodes] = useState(() => {
    const saved = localStorage.getItem(`personal_ps_active_coding_test_${course.id}`);
    if (saved && saved !== "{}") {
      const parsed = JSON.parse(saved);
      if (Number(parsed.durationSeconds) === Number(durationSeconds) && Number(parsed.passMarks) === Number(passMarks)) {
        if (parsed.codes && Object.keys(parsed.codes).length > 0) return parsed.codes;
      }
    }
    return {};
  });

  const [selectedLang, setSelectedLang] = useState(() => {
    const saved = localStorage.getItem(`personal_ps_active_coding_test_${course.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Number(parsed.durationSeconds) === Number(durationSeconds) && Number(parsed.passMarks) === Number(passMarks)) {
        if (parsed.selectedLangId) {
          const found = LANGUAGES.find(l => l.id === parsed.selectedLangId);
          if (found) return found;
        }
      }
    }
    return LANGUAGES[0];
  });

  // Execution states
  const [manualInput, setManualInput] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // Test case evaluation status: { [qnId]: { [testCaseId]: 'passed' | 'failed' | 'pending' | 'none' } }
  const [testCaseResults, setTestCaseResults] = useState(() => {
    const saved = localStorage.getItem(`personal_ps_active_coding_test_${course.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Number(parsed.durationSeconds) === Number(durationSeconds) && Number(parsed.passMarks) === Number(passMarks)) {
        return parsed.testCaseResults || {};
      }
    }
    return {};
  });
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(`personal_ps_active_coding_test_${course.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Number(parsed.durationSeconds) === Number(durationSeconds) && Number(parsed.passMarks) === Number(passMarks)) {
        return parsed.timeLeft !== undefined ? parsed.timeLeft : durationSeconds;
      }
    }
    return durationSeconds;
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sync test state to localStorage to survive page refreshes
  useEffect(() => {
    if (!isSubmitted) {
      localStorage.setItem(`personal_ps_active_coding_test_${course.id}`, JSON.stringify({
        activeQnIdx,
        codes,
        selectedLangId: selectedLang.id,
        timeLeft,
        testCaseResults,
        durationSeconds,
        passMarks
      }));
    }
  }, [activeQnIdx, codes, selectedLang, timeLeft, testCaseResults, isSubmitted, course.id, durationSeconds, passMarks]);

  // Initialize code templates (only if they are not already restored from localStorage)
  useEffect(() => {
    if (Object.keys(codes).length === 0) {
      const initialCodes = {};
      questions.forEach((q) => {
        initialCodes[q.id] = selectedLang.defaultCode;
      });
      setCodes(initialCodes);
    }
  }, [questions, codes, selectedLang]);

  // Handle language switch
  const handleLangChange = (langId) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (!lang) return;
    setSelectedLang(lang);
    
    // Update active code template
    setCodes(prev => ({
      ...prev,
      [activeQn.id]: lang.defaultCode
    }));
  };

  // Timer Hook
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) {
      if (timeLeft <= 0 && !isSubmitted) {
        handleSubmitTest();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle RUN code (manual input or first sample case)
  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsCompiling(true);
    setConsoleOutput("Compiling and executing code on sandbox...");

    const codeToRun = codes[activeQn.id] || "";
    const testInput = useManualInput ? manualInput : activeQn.sampleTestCases[0].input;

    const result = await runCodeOnJudge0(codeToRun, selectedLang.judge0Id, testInput);

    setIsRunning(false);
    setIsCompiling(false);

    if (result.compile_output) {
      setConsoleOutput(`Compilation Error:\n${result.compile_output}`);
      return;
    }

    let outputText = `Status: ${result.status}\nTime: ${result.time}s | Memory: ${result.memory}KB\n\n[STDOUT]\n${result.stdout}`;
    if (result.stderr) {
      outputText += `\n\n[STDERR]\n${result.stderr}`;
    }
    setConsoleOutput(outputText);
  };

  // Handle SUBMIT code (evaluates all 6 cases: 2 sample + 4 hidden)
  const handleSubmitCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsCompiling(true);
    setConsoleOutput("Submitting code to judge for evaluation...");

    const codeToRun = codes[activeQn.id] || "";
    const allCases = activeQn.hiddenTestCases || [];
    const newResults = { ...testCaseResults[activeQn.id] };

    // Initial status -> pending
    allCases.forEach(tc => {
      newResults[tc.id] = 'pending';
    });
    setTestCaseResults(prev => ({ ...prev, [activeQn.id]: newResults }));

    let passedCount = 0;
    let consoleLog = "Running test cases...\n";

    // Run each testcase in parallel
    const promises = allCases.map(async (tc, tcIdx) => {
      const response = await runCodeOnJudge0(codeToRun, selectedLang.judge0Id, tc.input);
      const cleanExpected = tc.output.trim();
      const cleanActual = response.stdout.trim();
      
      const isCorrect = cleanActual === cleanExpected;
      if (isCorrect) passedCount++;

      return { id: tc.id, idx: tcIdx + 1, passed: isCorrect, actual: cleanActual, expected: cleanExpected };
    });

    const evaluatedResults = await Promise.all(promises);

    const finalResults = {};
    evaluatedResults.forEach(res => {
      finalResults[res.id] = res.passed ? 'passed' : 'failed';
      consoleLog += `Test Case #${res.idx}: ${res.passed ? 'PASSED' : 'FAILED'} (Expected: "${res.expected}", Got: "${res.actual}")\n`;
    });

    setTestCaseResults(prev => ({
      ...prev,
      [activeQn.id]: finalResults
    }));

    setIsRunning(false);
    setIsCompiling(false);
    setConsoleOutput(`${consoleLog}\nVerdict: ${passedCount} / ${allCases.length} cases passed.`);
  };

  // Handle final submission of the entire assessment
  const handleSubmitTest = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    localStorage.removeItem(`personal_ps_active_coding_test_${course.id}`);

    // Calculate marks
    // Let's count cases passed for Q1 and Q2. Each case passed is worth 10 marks (Max 100 marks total across all questions)
    let totalPassedCases = 0;
    let totalCasesCount = 0;

    questions.forEach(q => {
      const allCases = q.hiddenTestCases || [];
      totalCasesCount += allCases.length;
      
      allCases.forEach(tc => {
        const status = testCaseResults[q.id]?.[tc.id];
        if (status === 'passed') {
          totalPassedCases++;
        }
      });
    });

    // Score: 10 marks per hidden testcase passed (total 10 cases = 100 marks)
    const score = totalPassedCases * 10;
    const maxScore = 100;
    const percentage = score;
    const passed = score >= (passMarks || 48);

    const finalResult = {
      score: `${score} / ${maxScore}`,
      percentage: percentage,
      passed: passed,
      passedCases: totalPassedCases,
      totalCases: totalCasesCount,
      timeSpent: formatTime(durationSeconds - timeLeft)
    };

    setGradingResult(finalResult);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-800 text-lg">{course.title} - Coding environment</h2>
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
      <div className={`flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:overflow-hidden lg:h-[calc(100vh-73px)] h-auto ${isSubmitted ? 'pointer-events-none select-none opacity-60' : ''}`}>
          
          {/* Left Side: Questions, Details & Testcases (1 Column) */}
          <div className="flex flex-col gap-4 overflow-y-auto h-full pr-1">
            
            {/* Tabs for switching coding questions */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQnIdx(idx)}
                  className={`flex-1 text-center py-2 rounded text-xs font-bold transition ${
                    idx === activeQnIdx
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Problem {idx + 1}
                </button>
              ))}
            </div>

            {/* Problem Description Panel */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-3">{activeQn.title}</h3>
              
              <div className="prose max-w-none text-xs text-gray-600 leading-relaxed mb-6">
                <p className="whitespace-pre-line">{activeQn.description}</p>
              </div>

              {/* Constraints */}
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-4 mb-5">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">CONSTRAINTS</h4>
                <pre className="font-mono text-[11px] text-amber-700">{activeQn.constraints}</pre>
              </div>

              {/* Sample Test Case (Shown to Student alongside question) */}
              {activeQn.sampleTestCases && activeQn.sampleTestCases.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Sample Test Case</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Input</span>
                      <pre className="bg-white border border-gray-200 rounded p-2 font-mono text-[11px] text-gray-800 whitespace-pre-wrap">{activeQn.sampleTestCases[0].input}</pre>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Output</span>
                      <pre className="bg-white border border-gray-200 rounded p-2 font-mono text-[11px] text-gray-800 whitespace-pre-wrap">{activeQn.sampleTestCases[0].output}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Cases Panel */}
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Test Cases Evaluation (Total 5)
              </h4>

              {/* Lists only hidden test cases (exactly 5) */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(activeQn.hiddenTestCases || []).map((tc, idx) => {
                  const result = testCaseResults[activeQn.id]?.[tc.id];

                  let colorClass = 'bg-gray-100 border-gray-200 text-gray-500';
                  let icon = <ChevronRight size={14} />;

                  if (result === 'pending') {
                    colorClass = 'bg-yellow-50 border-yellow-200 text-yellow-600 animate-pulse';
                    icon = <RefreshCw size={14} className="animate-spin" />;
                  } else if (result === 'passed') {
                    colorClass = 'bg-green-50 border-green-200 text-green-700';
                    icon = <CheckCircle size={14} />;
                  } else if (result === 'failed') {
                    colorClass = 'bg-red-50 border-red-200 text-red-700';
                    icon = <XCircle size={14} />;
                  }

                  return (
                    <div 
                      key={tc.id}
                      className={`flex items-center justify-between p-3.5 rounded-lg border text-xs font-bold transition ${colorClass}`}
                    >
                      <div className="flex items-center gap-2">
                        {icon}
                        <span>
                          Test Case #{idx + 1} (Hidden)
                        </span>
                      </div>
                      <span>
                        {result === 'passed' && 'Passed'}
                        {result === 'failed' && 'Failed'}
                        {result === 'pending' && 'Running'}
                        {!result && 'Ready'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Side: Code Editor (1 Column) */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden lg:h-full h-[750px]">
            {/* Editor Top Options bar */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select 
                  value={selectedLang.id}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:outline-none"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Run & Submit buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-4 rounded shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play size={12} /> Run Code
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-1.5 px-4 rounded shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} /> Submit Code
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-[250px]">
              <Editor
                height="100%"
                language={selectedLang.id === 'cpp' || selectedLang.id === 'c' ? 'cpp' : selectedLang.id}
                value={codes[activeQn.id] || ""}
                onChange={(val) => setCodes(prev => ({ ...prev, [activeQn.id]: val }))}
                theme="vs-light"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  lineNumbers: "on",
                  scrollbar: {
                    vertical: "auto",
                    horizontal: "auto"
                  }
                }}
              />
            </div>

            {/* Manual Input Checkbox & Output Panel (Make it big: h-72) */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 h-72 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="manual-input"
                    checked={useManualInput}
                    onChange={(e) => setUseManualInput(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="manual-input" className="text-xs font-bold text-gray-600 cursor-pointer">
                    Use Manual Input
                  </label>
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                  <Terminal size={10} /> Output Console
                </div>
              </div>

              {useManualInput && (
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Type standard input (stdin) for your program here..."
                  className="w-full h-16 border border-gray-300 rounded p-2 text-xs font-mono mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              )}

              {/* Console Output Screen */}
              <pre className="flex-1 bg-gray-900 text-green-400 font-mono text-xs p-3 rounded overflow-auto border border-gray-800 whitespace-pre-wrap">
                {consoleOutput || "Output will be displayed here after you Run or Submit code."}
              </pre>
            </div>
          </div>

        </div>

      {/* Centered Results Modal Box */}
      {isSubmitted && gradingResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-gray-100 text-center animate-scaleUp">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Test Completed</h3>
            <p className="text-gray-500 text-xs mb-6 uppercase tracking-wider">Final Marks Obtained</p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl py-6 mb-6">
              <span className="text-3xl font-black text-blue-600 block">
                {gradingResult.score}
              </span>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1 block">
                {gradingResult.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            
            <button
              onClick={() => onFinishTest(gradingResult)}
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
              You have attempted <strong className="text-green-600">{questions.filter(q => testCaseResults[q.id] !== undefined).length}</strong> out of <strong className="text-gray-800">{questions.length}</strong> coding problems.
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
                  handleSubmitTest();
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
