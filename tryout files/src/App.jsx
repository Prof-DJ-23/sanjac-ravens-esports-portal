import { Navigate, Route, Routes } from 'react-router-dom';
import TryoutFormPage from './pages/TryoutFormPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminTryoutsPage from './pages/admin/AdminTryoutsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TryoutFormPage />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/tryouts" element={<AdminTryoutsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
