import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LangProvider } from './context/LangContext'
import Navbar       from './components/Navbar'
import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Signup       from './pages/Signup'
import Dashboard    from './pages/Dashboard'
import JobFeed      from './pages/JobFeed'
import PostJob      from './pages/PostJob'
import MyJobs       from './pages/MyJobs'
import Applicants   from './pages/Applicants'
import Applications from './pages/Applications'
import Profile      from './pages/Profile'
import Admin        from './pages/Admin'
import PublicProfile from './pages/PublicProfile'
import Messages      from './pages/Messages'

function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔍</div>
      <h2>404 — Page Not Found</h2>
      <p className="text-muted" style={{ margin: '12px 0 24px' }}>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary">← Go Home</a>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <Navbar />
          <div className="page-wrapper">
            <Routes>
              <Route path="/"               element={<Landing />} />
              <Route path="/login"          element={<Login />} />
              <Route path="/signup"         element={<Signup />} />
              <Route path="/dashboard"      element={<Dashboard />} />
              <Route path="/jobs"           element={<JobFeed />} />
              <Route path="/post-job"       element={<PostJob />} />
              <Route path="/my-jobs"        element={<MyJobs />} />
              <Route path="/applicants/:id" element={<Applicants />} />
              <Route path="/applications"   element={<Applications />} />
              <Route path="/profile"        element={<Profile />} />
              <Route path="/worker/:id"     element={<PublicProfile />} />
              <Route path="/messages"       element={<Messages />} />
              <Route path="/admin"          element={<Admin />} />
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
