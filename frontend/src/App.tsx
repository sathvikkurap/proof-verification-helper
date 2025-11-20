import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Editor from './pages/Editor';
import ProofBuilder from './pages/ProofBuilder';
import Search from './pages/Search';
import Tutorials from './pages/Tutorials';
import Login from './pages/Login';
import Register from './pages/Register';
import Library from './pages/Library';

function App() {
  const { token } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="editor" element={<Editor />} />
          <Route path="editor/:id" element={<Editor />} />
          <Route path="builder" element={<ProofBuilder />} />
          <Route path="search" element={<Search />} />
          <Route path="tutorials" element={<Tutorials />} />
          <Route path="library" element={token ? <Library /> : <Navigate to="/login" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

