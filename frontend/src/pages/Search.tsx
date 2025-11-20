import { useState, useEffect } from 'react';
import { theoremsApi } from '../api/theorems';
import { Search as SearchIcon, Filter } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [theorems, setTheorems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query || category || difficulty) {
      searchTheorems();
    }
  }, [query, category, difficulty]);

  const searchTheorems = async () => {
    setLoading(true);
    try {
      const data = await theoremsApi.search(query, category, difficulty);
      setTheorems(data.theorems || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Theorem Search</h1>
        <p className="text-gray-600">
          Search for theorems, lemmas, and definitions from mathlib and your proofs.
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <div className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search theorems..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="algebra">Algebra</option>
                <option value="analysis">Analysis</option>
                <option value="topology">Topology</option>
                <option value="logic">Logic</option>
              </select>
            </div>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Searching...</div>
      ) : theorems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {query || category || difficulty
            ? 'No theorems found. Try different search terms.'
            : 'Enter a search query to find theorems.'}
        </div>
      ) : (
        <div className="space-y-4">
          {theorems.map((theorem) => (
            <div
              key={theorem.id}
              className="bg-white border border-gray-300 rounded-lg p-6 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {theorem.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 font-mono bg-gray-50 p-3 rounded">
                    {theorem.statement}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {theorem.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {theorem.category}
                      </span>
                    )}
                    {theorem.difficulty && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        {theorem.difficulty}
                      </span>
                    )}
                    {theorem.location && (
                      <span className="text-gray-500">{theorem.location}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

