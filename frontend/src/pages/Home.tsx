import { Link } from 'react-router-dom';
import { Code, Search, GraduationCap, Zap, BookOpen, TrendingUp } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Code,
      title: 'Interactive Editor',
      description: 'Write and edit Lean 4 proofs with syntax highlighting and real-time error checking.',
      link: '/editor',
    },
    {
      icon: Zap,
      title: 'AI-Powered Suggestions',
      description: 'Get intelligent recommendations for lemmas, tactics, and proof steps.',
      link: '/editor',
    },
    {
      icon: BookOpen,
      title: 'Proof Visualization',
      description: 'Visualize proof structure and dependencies with interactive graphs.',
      link: '/editor',
    },
    {
      icon: Search,
      title: 'Theorem Search',
      description: 'Search and explore theorems from mathlib and your own proofs.',
      link: '/search',
    },
    {
      icon: GraduationCap,
      title: 'Step-by-Step Builder',
      description: 'Build proofs incrementally with guided step suggestions.',
      link: '/builder',
    },
    {
      icon: TrendingUp,
      title: 'Learn & Tutorials',
      description: 'Interactive tutorials and examples to learn Lean 4.',
      link: '/tutorials',
    },
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Proof Verification Helper
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          An intelligent assistant for working with Lean 4 formal proofs. Get AI-powered
          suggestions, visualize proof structure, and learn formal verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              to={feature.link}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Start with the Editor</h3>
              <p className="text-gray-600">
                Open the proof editor and paste or write your Lean 4 code. The app will
                automatically parse and analyze your proof.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Get AI Suggestions</h3>
              <p className="text-gray-600">
                View AI-powered suggestions for lemmas, tactics, and next steps. Apply
                suggestions directly to your proof.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Visualize & Explore</h3>
              <p className="text-gray-600">
                Explore the dependency graph of your proof, search for relevant theorems,
                and understand proof structure.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link
            to="/editor"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

