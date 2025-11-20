import { BookOpen, PlayCircle, CheckCircle } from 'lucide-react';

export default function Tutorials() {
  const tutorials = [
    {
      id: 1,
      title: 'Introduction to Lean 4',
      description: 'Learn the basics of Lean 4 syntax and proof structure.',
      duration: '15 min',
      difficulty: 'beginner',
      completed: false,
    },
    {
      id: 2,
      title: 'Basic Proof Tactics',
      description: 'Master fundamental tactics like apply, exact, and simp.',
      duration: '20 min',
      difficulty: 'beginner',
      completed: false,
    },
    {
      id: 3,
      title: 'Working with Theorems',
      description: 'Learn how to state and prove theorems in Lean 4.',
      duration: '25 min',
      difficulty: 'intermediate',
      completed: false,
    },
    {
      id: 4,
      title: 'Advanced Proof Techniques',
      description: 'Explore induction, cases, and other advanced techniques.',
      duration: '30 min',
      difficulty: 'advanced',
      completed: false,
    },
  ];

  const examples = [
    {
      title: 'Simple Theorem',
      code: `theorem add_zero (n : Nat) : n + 0 = n := by
  simp`,
      explanation: 'A simple theorem showing that adding zero to a number returns the number.',
    },
    {
      title: 'Commutativity of Addition',
      code: `theorem add_comm (a b : Nat) : a + b = b + a := by
  induction a with
  | zero => simp
  | succ n ih => simp [add_succ, ih]`,
      explanation: 'Proving that addition is commutative using induction.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutorials & Learning</h1>
        <p className="text-gray-600">
          Interactive tutorials and examples to help you learn Lean 4 and formal verification.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Interactive Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="bg-white border border-gray-300 rounded-lg p-6 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tutorial.title}
                    </h3>
                    <p className="text-sm text-gray-500">{tutorial.duration}</p>
                  </div>
                </div>
                {tutorial.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <PlayCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <p className="text-gray-600 mb-4">{tutorial.description}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    tutorial.difficulty === 'beginner'
                      ? 'bg-green-100 text-green-800'
                      : tutorial.difficulty === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tutorial.difficulty}
                </span>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Start Tutorial →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Example Proofs</h2>
        <div className="space-y-6">
          {examples.map((example, index) => (
            <div
              key={index}
              className="bg-white border border-gray-300 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {example.title}
              </h3>
              <p className="text-gray-600 mb-4">{example.explanation}</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{example.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

