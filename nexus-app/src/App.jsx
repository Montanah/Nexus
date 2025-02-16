import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import LandingPage from './Pages/landingPage/';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Add more routes here */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;