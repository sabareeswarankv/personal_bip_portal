export const initialCourses = [
  {
    id: "algebra-2",
    title: "Algebra - Level 2",
    banner: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80",
    description: "Master polynomial operations, equations, and word problems.",
    type: "mcq",
    materials: [
      { id: "mat1", title: "1. Polynomials", type: "video", url: "https://www.youtube.com/embed/ffLLmV4mZwU" },
      { id: "mat2", title: "2. Modeling with polynomials", type: "video", url: "https://www.youtube.com/embed/3M8pT1O4l2Q" },
      { id: "mat3", title: "3. Rational Equations Distance Word Problems", type: "video", url: "https://www.youtube.com/embed/gS2aR-2bUsw" }
    ],
    assessment: {
      type: "mcq",
      durationSeconds: 3600, // 1 hour
      passMarks: 24,
      negativeMark: 0.25,
      questions: Array.from({ length: 40 }, (_, idx) => {
        const a = (idx + 1) * 3;
        const b = (idx + 1) * 2;
        const sum = a + b;
        return {
          id: `alg_q_${idx + 1}`,
          text: `Solve for x in the equation: ${idx + 1}x + ${b} = ${idx + 1}x + ${idx + 1}x - ${a - b}. What is the value when simplified? (Question #${idx + 1})`,
          options: [
            `x = ${idx + 1}`,
            `x = ${idx + 2}`,
            `x = ${sum}`,
            `x = -${idx + 1}`,
            `x = 0`,
            `None of the above`
          ],
          correctIndex: idx % 6
        };
      })
    }
  },
  {
    id: "cpp-level-2",
    title: "Programming C++ - Level 2",
    banner: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=600&q=80",
    description: "Solve intermediate level coding challenges in C++.",
    type: "coding",
    materials: [
      { id: "mat_cpp_1", title: "1. Classes and Objects in C++", type: "video", url: "https://www.youtube.com/embed/wN0x9eDGjc0" },
      { id: "mat_cpp_2", title: "2. Pointers and Memory Management", type: "video", url: "https://www.youtube.com/embed/rtgwvkaYt1A" }
    ],
    assessment: {
      type: "coding",
      durationSeconds: 3600, // 1 hour
      questions: [
        {
          id: "cpp_code_1",
          title: "1. Sum of Array Elements",
          description: "Given an array of integers, write a program to calculate the sum of all elements in the array. The first line of input contains an integer N representing the size of the array. The second line contains N space-separated integers representing the array elements.",
          constraints: "1 <= N <= 10^5\n-10^9 <= Arr[i] <= 10^9",
          sampleTestCases: [
            { id: 1, input: "5\n1 2 3 4 5", output: "15" },
            { id: 2, input: "3\n-1 0 1", output: "0" }
          ],
          hiddenTestCases: [
            { id: 3, input: "1\n100", output: "100" },
            { id: 4, input: "4\n10 20 30 40", output: "100" },
            { id: 5, input: "5\n-5 -10 -15 -20 -25", output: "-75" },
            { id: 6, input: "2\n1000000000 1000000000", output: "2000000000" }
          ]
        },
        {
          id: "cpp_code_2",
          title: "2. Find Even or Odd",
          description: "Write a program that takes an integer N as input and prints 'Even' if it is even, and 'Odd' if it is odd.",
          constraints: "-10^9 <= N <= 10^9",
          sampleTestCases: [
            { id: 1, input: "4", output: "Even" },
            { id: 2, input: "7", output: "Odd" }
          ],
          hiddenTestCases: [
            { id: 3, input: "0", output: "Even" },
            { id: 4, input: "-2", output: "Even" },
            { id: 5, input: "-39", output: "Odd" },
            { id: 6, input: "1000000001", output: "Odd" }
          ]
        }
      ]
    }
  }
];
