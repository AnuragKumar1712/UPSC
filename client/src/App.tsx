import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SectionsPage from './pages/SectionsPage';
import TopicsPage from './pages/TopicsPage';
import QuestionBuilderPage from './pages/QuestionBuilderPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuizPage from './pages/QuizPage';
import QuizAttemptPage from './pages/QuizAttemptPage';
import ResultsPage from './pages/ResultsPage';
import ReviewAnswersPage from './pages/ReviewAnswersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BookmarksPage from './pages/BookmarksPage';
import RevisionPage from './pages/RevisionPage';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { username, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-upsc-navy">Loading...</p>
      </div>
    );
  }
  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="sections" element={<SectionsPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="builder" element={<QuestionBuilderPage />} />
        <Route path="bank" element={<QuestionBankPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="quiz/attempt" element={<QuizAttemptPage />} />
        <Route path="results/:id" element={<ResultsPage />} />
        <Route path="review/:id" element={<ReviewAnswersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="revision" element={<RevisionPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
