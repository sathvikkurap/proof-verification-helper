import { Link } from 'react-router-dom';
import { Code, Search, GraduationCap, Zap, BookOpen, TrendingUp, Sparkles, Target, Brain } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Proof Copilot',
      description: 'Your intelligent mathematical assistant that understands formal proofs and provides context-aware suggestions.',
      link: '/builder',
      highlight: true,
    },
    {
      icon: Brain,
      title: 'Intelligent Guidance',
      description: 'Advanced AI analyzes your proof state and suggests optimal next steps with detailed explanations.',
      link: '/builder',
    },
    {
      icon: Target,
      title: 'Goal-Oriented Workflow',
      description: 'Focus on mathematical reasoning while AI handles the technical details of formal proof construction.',
      link: '/editor',
    },
    {
      icon: Code,
      title: 'Lean 4 Integration',
      description: 'Full support for Lean 4 syntax with real-time parsing and verification.',
      link: '/editor',
    },
    {
      icon: BookOpen,
      title: 'Personal Proof Library',
      description: 'Save and organize your proofs, track progress, and build upon previous work.',
      link: '/library',
    },
    {
      icon: Search,
      title: 'Mathematical Knowledge',
      description: 'Access theorems, lemmas, and definitions from Mathlib with intelligent search.',
      link: '/search',
    },
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="w-12 h-12 text-purple-600 mr-4" />
          <h1 className="text-5xl font-bold text-gray-900">
            Mathematician's AI Copilot
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
          Transform your mathematical thinking into formal proofs with intelligent AI assistance.
          Focus on the mathematics while your AI copilot handles the technical details.
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>AI-Powered Reasoning</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Lean 4 Integration</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Personal Library</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isHighlighted = feature.highlight;
          return (
            <Link
              key={feature.title}
              to={feature.link}
              className={`p-6 rounded-lg border transition-all duration-200 ${
                isHighlighted
                  ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300 hover:shadow-xl ring-2 ring-purple-100'
                  : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  isHighlighted ? 'bg-purple-100' : 'bg-primary-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isHighlighted ? 'text-purple-600' : 'text-primary-600'
                  }`} />
                </div>
                <h3 className={`text-lg font-semibold ${
                  isHighlighted ? 'text-purple-900' : 'text-gray-900'
                }`}>
                  {feature.title}
                  {isHighlighted && <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Featured</span>}
                </h3>
              </div>
              <p className={`${
                isHighlighted ? 'text-purple-700' : 'text-gray-600'
              }`}>{feature.description}</p>
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

