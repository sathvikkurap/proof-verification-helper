import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { proofsApi } from '../api/proofs';
import api from '../api/client';
import { BookOpen, Trash2, Eye } from 'lucide-react';

export default function Library() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProofs();
  }, []);

  const loadProofs = async () => {
    try {
      const response = await api.get('/user/proofs');
      setProofs(response.data.proofs || []);
    } catch (error) {
      console.error('Failed to load proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proof?')) return;

    try {
      await proofsApi.delete(id);
      setProofs(proofs.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete proof:', error);
      alert('Failed to delete proof');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading your library...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Proof Library</h1>
        <p className="text-gray-600">
          Your saved proofs and personal collection.
        </p>
      </div>

      {proofs.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-300 rounded-lg">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Your library is empty.</p>
          <Link
            to="/editor"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Create your first proof →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-white border border-gray-300 rounded-lg p-6 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{proof.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    proof.status === 'complete'
                      ? 'bg-green-100 text-green-800'
                      : proof.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {proof.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4 font-mono line-clamp-3">
                {proof.code.substring(0, 100)}...
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Updated {new Date(proof.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to={`/editor/${proof.id}`}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center text-sm flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Open</span>
                </Link>
                <button
                  onClick={() => handleDelete(proof.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

