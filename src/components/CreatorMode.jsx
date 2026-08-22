import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash, Save, HelpCircle, FileJson, Sparkles } from 'lucide-react';

export default function CreatorMode({ onBack, onSaveCourse, onUpdateCourse, editingCourse }) {
  const [courseTitle, setCourseTitle] = useState(editingCourse ? editingCourse.title : "");
  const [courseDesc, setCourseDesc] = useState(editingCourse ? editingCourse.description : "");
  const [courseBanner, setCourseBanner] = useState(editingCourse ? editingCourse.banner : "");
  const [courseType, setCourseType] = useState(editingCourse ? editingCourse.type : "mcq"); // mcq or coding
  const [jsonText, setJsonText] = useState("");

  const [durationMins, setDurationMins] = useState(
    editingCourse ? Math.round(editingCourse.assessment.durationSeconds / 60) : 60
  );
  const [passMarks, setPassMarks] = useState(
    editingCourse ? editingCourse.assessment.passMarks : (courseType === 'mcq' ? 24 : 48)
  );

  // Materials list
  const [materials, setMaterials] = useState(editingCourse ? editingCourse.materials : [
    { title: "1. Introductory Material", type: "video", url: "https://www.youtube.com/embed/ffLLmV4mZwU" }
  ]);

  // Questions builder states
  const [mcqQuestions, setMcqQuestions] = useState(
    editingCourse && editingCourse.type === 'mcq'
      ? editingCourse.assessment.questions
      : [
          {
            text: "Sample MCQ Question: Solve 2x + 4 = 10.",
            options: ["x = 1", "x = 2", "x = 3", "x = 4", "x = 5", "x = 6"],
            correctIndex: 2
          }
        ]
  );

  const [codingQuestions, setCodingQuestions] = useState(
    editingCourse && editingCourse.type === 'coding'
      ? editingCourse.assessment.questions.map(q => {
          const rawSamples = q.sampleTestCases || [];
          const sampleCases = [
            { input: rawSamples[0]?.input || "", output: rawSamples[0]?.output || "" }
          ];
          const rawHidden = q.hiddenTestCases || [];
          const hiddenCases = Array.from({ length: 5 }, (_, i) => ({
            input: rawHidden[i]?.input || "",
            output: rawHidden[i]?.output || ""
          }));

          return {
            title: q.title || "",
            description: q.description || "",
            constraints: q.constraints || "",
            sampleCases,
            hiddenCases
          };
        })
      : [
          {
            title: "Sample Coding Problem",
            description: "Write a program that inputs two integers and prints their product.",
            constraints: "1 <= A, B <= 1000",
            sampleCases: [
              { input: "5 4", output: "20" }
            ],
            hiddenCases: Array.from({ length: 5 }, (_, i) => {
              const defaults = [
                { input: "3 9", output: "27" },
                { input: "0 10", output: "0" },
                { input: "100 100", output: "10000" },
                { input: "-5 5", output: "-25" },
                { input: "1 1", output: "1" }
              ];
              return defaults[i] || { input: "", output: "" };
            })
          }
        ]
  );

  // Material helpers
  const addMaterialField = () => {
    setMaterials([...materials, { title: "", type: "video", url: "" }]);
  };

  const removeMaterialField = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  // MCQ helpers
  const addMcqField = () => {
    setMcqQuestions([...mcqQuestions, {
      text: "",
      options: ["", "", "", "", "", ""],
      correctIndex: 0
    }]);
  };

  const removeMcqField = (index) => {
    setMcqQuestions(mcqQuestions.filter((_, i) => i !== index));
  };

  // Coding helpers
  const addCodingField = () => {
    setCodingQuestions([...codingQuestions, {
      title: "",
      description: "",
      constraints: "",
      sampleCases: [
        { input: "", output: "" }
      ],
      hiddenCases: Array.from({ length: 5 }, () => ({ input: "", output: "" }))
    }]);
  };

  const removeCodingField = (index) => {
    setCodingQuestions(codingQuestions.filter((_, i) => i !== index));
  };

  const handleAutoGenerateMcqs = () => {
    const generated = Array.from({ length: 40 }, (_, idx) => {
      const qNum = idx + 1;
      return {
        text: `Practice Question #${qNum}: Evaluate the value of ${qNum * 12} divided by 4, then multiplied by 3. What is the result?`,
        options: [
          `${(qNum * 12 / 4) * 3}`,
          `${(qNum * 12 / 4) * 2}`,
          `${(qNum * 12 / 3) * 3}`,
          `${(qNum * 10 / 4) * 3}`,
          `${(qNum * 12 / 4) * 4}`,
          `None of the above`
        ],
        correctIndex: 0
      };
    });
    setMcqQuestions(generated);
    alert("Successfully auto-generated 40 practice MCQs in the form list below!");
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        alert("JSON must be an array of questions!");
        return;
      }
      
      if (courseType === 'mcq') {
        const isValid = parsed.every(q => 
          typeof q.text === 'string' && 
          Array.isArray(q.options) && 
          q.options.length === 6 && 
          typeof q.correctIndex === 'number'
        );
        if (!isValid) {
          alert("MCQ format incorrect. Each question must have 'text' (string), 'options' (array of 6 strings), and 'correctIndex' (number 0-5).");
          return;
        }
        setMcqQuestions(parsed);
        alert(`Successfully imported ${parsed.length} MCQs!`);
      } else {
        const isValid = parsed.every(q => 
          typeof q.title === 'string' && 
          typeof q.description === 'string' && 
          typeof q.constraints === 'string' && 
          Array.isArray(q.sampleCases) && 
          Array.isArray(q.hiddenCases)
        );
        if (!isValid) {
          alert("Coding format incorrect. Each question must have 'title' (string), 'description' (string), 'constraints' (string), 'sampleCases' (array), and 'hiddenCases' (array).");
          return;
        }
        
        // Enforce exactly 1 sample case and 5 hidden cases for all imported questions
        const sanitized = parsed.map(q => {
          const rawSamples = q.sampleCases || [];
          const sampleCases = [
            { input: rawSamples[0]?.input || "", output: rawSamples[0]?.output || "" }
          ];
          const rawHidden = q.hiddenCases || [];
          const hiddenCases = Array.from({ length: 5 }, (_, i) => ({
            input: rawHidden[i]?.input || "",
            output: rawHidden[i]?.output || ""
          }));

          return {
            title: q.title,
            description: q.description,
            constraints: q.constraints,
            sampleCases,
            hiddenCases
          };
        });

        setCodingQuestions(sanitized);
        alert(`Successfully imported ${parsed.length} coding questions!`);
      }
      setJsonText("");
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };

  const handleSave = () => {
    if (!courseTitle || !courseDesc) {
      alert("Please fill in course title and description.");
      return;
    }

    const newCourse = {
      id: courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: courseTitle,
      banner: courseBanner || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      description: courseDesc,
      type: courseType,
      materials: materials.map((m, idx) => ({
        id: `mat_custom_${idx}`,
        ...m
      })),
      assessment: {
        type: courseType,
        durationSeconds: (parseInt(durationMins) || 60) * 60,
        passMarks: parseInt(passMarks) || 24,
        negativeMark: 0.25,
        questions: courseType === 'mcq' 
          ? mcqQuestions.map((q, idx) => ({ id: `custom_mcq_${idx}`, ...q }))
          : codingQuestions.map((q, idx) => ({
              id: `custom_code_${idx}`,
              title: q.title,
              description: q.description,
              constraints: q.constraints,
              sampleTestCases: q.sampleCases.map((c, cIdx) => ({ id: cIdx + 1, ...c })),
              hiddenTestCases: q.hiddenCases.map((c, cIdx) => ({ id: cIdx + 2, ...c }))
            }))
      }
    };

    if (editingCourse) {
      onUpdateCourse({
        ...newCourse,
        id: editingCourse.id // Keep the same ID
      });
      alert("Assessment Course updated successfully!");
    } else {
      onSaveCourse(newCourse);
      alert("New Course and Questions added successfully!");
    }
    onBack();
  };

  return (
    <div className="w-full px-6 md:px-12 py-8">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-medium mb-6 transition"
      >
        <ChevronLeft size={20} />
        Back to Dashboard
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {editingCourse ? "Edit Assessment Course" : "Assessment Creator"}
          </h1>
          <p className="text-gray-500 text-sm">
            {editingCourse ? "Modify course settings, materials, and exam questions." : "Add custom courses, learning materials, and practice exams."}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-md transition shadow-md text-sm"
        >
          <Save size={18} />
          Save Assessment
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Section 1: Course Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">1. Course Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Course Title</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. C Programming Level - 5"
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Banner Image</label>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCourseBanner(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Upload local image (saved as Base64 data)</p>
                </div>
                
                {courseBanner && (
                  <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden shrink-0 shadow-sm bg-gray-50">
                    <img src={courseBanner} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <input
                type="text"
                value={courseBanner && courseBanner.startsWith('data:') ? "" : courseBanner}
                onChange={(e) => setCourseBanner(e.target.value)}
                placeholder="Or paste an image URL instead"
                className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Course Description</label>
              <textarea
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="Briefly summarize course goals."
                className="w-full h-20 border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Assessment Type</label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="mcq">Multiple Choice Questions (MCQ)</option>
                <option value="coding">Coding Sandbox Challenge</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Time Limit (Minutes)</label>
              <input
                type="number"
                min="1"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                placeholder="e.g. 60"
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Passing Marks</label>
              <input
                type="number"
                min="1"
                value={passMarks}
                onChange={(e) => setPassMarks(e.target.value)}
                placeholder="e.g. 24"
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Materials Builder */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h2 className="text-base font-bold text-gray-800">2. YouTube Study Materials</h2>
            <button
              onClick={addMaterialField}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded"
            >
              <Plus size={14} /> Add Video Link
            </button>
          </div>

          <div className="space-y-4">
            {materials.map((mat, index) => (
              <div key={index} className="flex gap-4 items-end border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Video Title</label>
                  <input
                    type="text"
                    value={mat.title}
                    onChange={(e) => {
                      const updated = [...materials];
                      updated[index].title = e.target.value;
                      setMaterials(updated);
                    }}
                    placeholder="e.g. 1. Introduction to Pointers"
                    className="w-full border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                  />
                </div>
                <div className="flex-[2_2_0%]">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">YouTube Embed URL</label>
                  <input
                    type="text"
                    value={mat.url}
                    onChange={(e) => {
                      const updated = [...materials];
                      updated[index].url = e.target.value;
                      setMaterials(updated);
                    }}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    className="w-full border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                  />
                </div>
                <button
                  onClick={() => removeMaterialField(index)}
                  className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded border border-red-200"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Bulk Operations (Auto-generator & JSON Import) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">3. Bulk Operations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Auto generator block */}
            <div className="flex flex-col justify-between border-r border-gray-100 pr-0 md:pr-8">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-yellow-500" />
                  Auto-Generate Practice Questions
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Don't want to type questions one-by-one? Click the button below to instantly populate your assessment with **40 realistic, pre-configured MCQ questions** for practice.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateMcqs}
                disabled={courseType !== 'mcq'}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-4 rounded transition shadow text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} /> Auto-Generate 40 MCQs
              </button>
            </div>

            {/* JSON Importer block */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <FileJson size={16} className="text-blue-500" />
                JSON Bulk Import
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Paste a raw JSON array of questions to load them instantly. 
                <span className="text-blue-600 hover:underline cursor-pointer ml-1 font-semibold flex items-center gap-0.5 inline-flex" onClick={() => {
                  if (courseType === 'mcq') {
                    setJsonText(JSON.stringify([
                      {
                        "text": "Solve 3x - 5 = 10. What is x?",
                        "options": ["x = 5", "x = 2", "x = 3", "x = 4", "x = 10", "x = 15"],
                        "correctIndex": 0
                      }
                    ], null, 2));
                  } else {
                    setJsonText(JSON.stringify([
                      {
                        "title": "Multiply Two Numbers",
                        "description": "Write a program to multiply A and B.",
                        "constraints": "1 <= A, B <= 10^5",
                        "sampleCases": [{"input": "3 4", "output": "12"}],
                        "hiddenCases": [{"input": "0 1", "output": "0"}]
                      }
                    ], null, 2));
                  }
                }}>
                  (Load JSON Template)
                </span>
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={courseType === 'mcq' 
                  ? 'Paste MCQ JSON array here (needs text, options array of 6, correctIndex)...' 
                  : 'Paste Coding JSON array here (needs title, description, constraints, sampleCases, hiddenCases)...'
                }
                className="w-full h-24 border border-gray-300 rounded p-2 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleImportJson}
                disabled={!jsonText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded transition shadow text-xs uppercase tracking-wider disabled:opacity-40"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: MCQ or Coding Questions Builder */}
        {courseType === "mcq" ? (
          /* MCQ Builder list (Requires 40 for real simulation, but user can add as many as they want) */
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-base font-bold text-gray-800">4. Multiple Choice Questions</h2>
              <button
                onClick={addMcqField}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded"
              >
                <Plus size={14} /> Add MCQ
              </button>
            </div>

            <div className="space-y-6">
              {mcqQuestions.map((q, qIndex) => (
                <div key={qIndex} className="border border-gray-200 p-5 rounded-lg bg-gray-50/50 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                    <span className="text-xs font-extrabold text-blue-600">MCQ QUESTION #{qIndex + 1}</span>
                    <button
                      onClick={() => removeMcqField(qIndex)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash size={12} /> Remove
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Question Text</label>
                    <textarea
                      value={q.text}
                      onChange={(e) => {
                        const updated = [...mcqQuestions];
                        updated[qIndex].text = e.target.value;
                        setMcqQuestions(updated);
                      }}
                      placeholder="Write your MCQ question details here..."
                      className="w-full h-16 border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                    />
                  </div>

                  {/* 6 Options Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-gray-400 w-5">
                          {String.fromCharCode(65 + oIdx)}:
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...mcqQuestions];
                            updated[qIndex].options[oIdx] = e.target.value;
                            setMcqQuestions(updated);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          className="flex-1 border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Option Dropdown */}
                  <div className="max-w-xs">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Correct Option</label>
                    <select
                      value={q.correctIndex}
                      onChange={(e) => {
                        const updated = [...mcqQuestions];
                        updated[qIndex].correctIndex = parseInt(e.target.value);
                        setMcqQuestions(updated);
                      }}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                    >
                      {q.options.map((_, oIdx) => (
                        <option key={oIdx} value={oIdx}>
                          Option {String.fromCharCode(65 + oIdx)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Coding Questions Builder list */
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-base font-bold text-gray-800">4. Coding Problems</h2>
              <button
                onClick={addCodingField}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded"
              >
                <Plus size={14} /> Add Problem
              </button>
            </div>

            <div className="space-y-8">
              {codingQuestions.map((q, qIndex) => (
                <div key={qIndex} className="border border-gray-200 p-5 rounded-lg bg-gray-50/50 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                    <span className="text-xs font-extrabold text-blue-600">CODING PROBLEM #{qIndex + 1}</span>
                    <button
                      onClick={() => removeCodingField(qIndex)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash size={12} /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Problem Title</label>
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => {
                          const updated = [...codingQuestions];
                          updated[qIndex].title = e.target.value;
                          setCodingQuestions(updated);
                        }}
                        placeholder="e.g. Reverse an Array"
                        className="w-full border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Constraints</label>
                      <input
                        type="text"
                        value={q.constraints}
                        onChange={(e) => {
                          const updated = [...codingQuestions];
                          updated[qIndex].constraints = e.target.value;
                          setCodingQuestions(updated);
                        }}
                        placeholder="e.g. 1 <= N <= 100000"
                        className="w-full border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Problem Description</label>
                    <textarea
                      value={q.description}
                      onChange={(e) => {
                        const updated = [...codingQuestions];
                        updated[qIndex].description = e.target.value;
                        setCodingQuestions(updated);
                      }}
                      placeholder="Explain the requirements, input/output structures..."
                      className="w-full h-20 border border-gray-300 bg-white rounded p-2 text-xs outline-none"
                    />
                  </div>

                  {/* Test Cases Subsections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1 Sample case */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase">Sample Test Case (Shown on Screen)</h4>
                      {q.sampleCases.map((sc, sIdx) => (
                        <div key={sIdx} className="bg-white border border-gray-200 p-3 rounded space-y-2">
                          <span className="text-[10px] font-extrabold text-gray-400">SAMPLE TEST CASE</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={sc.input}
                              onChange={(e) => {
                                const updated = [...codingQuestions];
                                updated[qIndex].sampleCases[sIdx].input = e.target.value;
                                setCodingQuestions(updated);
                              }}
                              placeholder="Input (stdin)"
                              className="border border-gray-300 rounded p-1.5 text-[11px] outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={sc.output}
                              onChange={(e) => {
                                const updated = [...codingQuestions];
                                updated[qIndex].sampleCases[sIdx].output = e.target.value;
                                setCodingQuestions(updated);
                              }}
                              placeholder="Output (stdout)"
                              className="border border-gray-300 rounded p-1.5 text-[11px] outline-none font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 5 Hidden cases */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase">5 Hidden Test Cases (Secret Grading)</h4>
                      {q.hiddenCases.map((hc, hIdx) => (
                        <div key={hIdx} className="bg-white border border-gray-200 p-3 rounded space-y-2">
                          <span className="text-[10px] font-extrabold text-gray-400">HIDDEN #{hIdx + 1}</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={hc.input}
                              onChange={(e) => {
                                const updated = [...codingQuestions];
                                updated[qIndex].hiddenCases[hIdx].input = e.target.value;
                                setCodingQuestions(updated);
                              }}
                              placeholder="Input (stdin)"
                              className="border border-gray-300 rounded p-1.5 text-[11px] outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={hc.output}
                              onChange={(e) => {
                                const updated = [...codingQuestions];
                                updated[qIndex].hiddenCases[hIdx].output = e.target.value;
                                setCodingQuestions(updated);
                              }}
                              placeholder="Output (stdout)"
                              className="border border-gray-300 rounded p-1.5 text-[11px] outline-none font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
