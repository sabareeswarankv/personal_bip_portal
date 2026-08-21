// Map standard languages to Judge0 language IDs
export const LANGUAGES = [
  { id: "python", name: "Python 3", judge0Id: 71, defaultCode: "import sys\n\ndef main():\n    # Read input from stdin\n    # lines = sys.stdin.read().split()\n    print('Hello World')\n\nif __name__ == '__main__':\n    main()" },
  { id: "cpp", name: "C++ (GCC 9.2.0)", judge0Id: 54, defaultCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // read inputs here\n    cout << \"Hello World\" << endl;\n    return 0;\n}" },
  { id: "c", name: "C (GCC 9.2.0)", judge0Id: 50, defaultCode: "#include <stdio.h>\n\nint main() {\n    printf(\"Hello World\\n\");\n    return 0;\n}" },
  { id: "java", name: "Java (OpenJDK 13.0.1)", judge0Id: 62, defaultCode: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}" }
];

// Paste your RapidAPI Key below to enable the official Judge0 compiler (highly recommended for production!)
// To get a free key: Sign up at rapidapi.com and search/subscribe to "Judge0 CE".
const RAPID_API_KEY = ""; 

// Map language IDs to Wandbox compiler names (100% Free, CORS-wildcarded, no key required)
const wandboxCompilerMap = {
  71: "cpython-3.12.7",     // Python
  54: "gcc-13.2.0",        // C++
  50: "gcc-13.2.0-c",      // C
  62: "openjdk-jdk-21+35"  // Java
};

/**
 * Execute code using Judge0 (if RAPID_API_KEY is set) or Wandbox (free sandbox engine)
 */
export async function runCodeOnJudge0(sourceCode, languageJudge0Id, stdin) {
  // Option A: Use Judge0 CE API if Key is provided
  if (RAPID_API_KEY && RAPID_API_KEY.trim() !== "") {
    try {
      const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json",
          "x-rapidapi-key": RAPID_API_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com"
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: languageJudge0Id,
          stdin: stdin
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          stdout: data.stdout || "",
          stderr: data.stderr || "",
          compile_output: data.compile_output || "",
          time: data.time || "0",
          memory: data.memory || "0",
          status: data.status ? data.status.description : "Completed",
          success: data.status && data.status.id === 3 // 3 = Accepted
        };
      }
    } catch (error) {
      console.warn("Judge0 API failed, falling back to Wandbox:", error);
    }
  }

  // Option B: Fallback to Wandbox Compiler API (100% Free, No Sign-up/API Keys, Wildcard CORS)
  try {
    const wandboxCompiler = wandboxCompilerMap[languageJudge0Id] || "cpython-3.12.7";
    
    const response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        compiler: wandboxCompiler,
        code: sourceCode,
        stdin: stdin || ""
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      const stdout = data.program_output || "";
      const stderr = data.program_error || "";
      const compileErr = data.compiler_error || data.compiler_message || "";
      
      const hasError = data.status !== "0" || !!stderr || !!compileErr;
      
      return {
        stdout: stdout,
        stderr: stderr,
        compile_output: compileErr,
        time: "0.1",
        memory: "2048",
        status: hasError ? "Runtime/Compile Error" : "Accepted",
        success: !hasError
      };
    }
  } catch (error) {
    console.warn("Wandbox compiler execution failed:", error);
  }

  // Option C: Hard offline mock message
  await new Promise(r => setTimeout(r, 500));
  
  return {
    stdout: "Offline: Compile Server temporarily unreachable.",
    stderr: "Network Error",
    compile_output: "Unable to connect to compile server.",
    time: "0",
    memory: "0",
    status: "Error",
    success: false
  };
}
