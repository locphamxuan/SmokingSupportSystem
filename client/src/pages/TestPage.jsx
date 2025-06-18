import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const TestPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  console.log('TestPage render:', { user, isAuthenticated, loading });

  const testNavigation = (path) => {
    console.log('Testing navigation to:', path);
    navigate(path);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Navigation Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Auth Status:</h3>
        <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User: {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Public Pages:</h3>
        <button onClick={() => testNavigation('/')} style={{ margin: '5px' }}>Home</button>
        <button onClick={() => testNavigation('/about')} style={{ margin: '5px' }}>About</button>
        <button onClick={() => testNavigation('/blog')} style={{ margin: '5px' }}>Community</button>
        <button onClick={() => testNavigation('/leaderboard')} style={{ margin: '5px' }}>Leaderboard</button>
      </div>

      {!isAuthenticated ? (
        <div style={{ marginBottom: '20px' }}>
          <h3>Auth Pages:</h3>
          <button onClick={() => testNavigation('/login')} style={{ margin: '5px' }}>Login</button>
          <button onClick={() => testNavigation('/register')} style={{ margin: '5px' }}>Register</button>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <h3>Protected Pages:</h3>
          <button onClick={() => testNavigation('/profile')} style={{ margin: '5px' }}>Profile</button>
          <button onClick={() => testNavigation('/my-progress')} style={{ margin: '5px' }}>My Progress</button>
          <button onClick={() => testNavigation('/create-post')} style={{ margin: '5px' }}>Create Post</button>
          <button onClick={() => testNavigation('/subscribe')} style={{ margin: '5px' }}>Subscribe</button>
          <button onClick={() => testNavigation('/booking')} style={{ margin: '5px' }}>Booking</button>
          <button onClick={() => testNavigation('/achievements')} style={{ margin: '5px' }}>Achievements</button>
        </div>
      )}

      {user?.role === 'admin' && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Admin Pages:</h3>
          <button onClick={() => testNavigation('/admin/users')} style={{ margin: '5px' }}>Admin Users</button>
        </div>
      )}

      {user?.role === 'coach' && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Coach Pages:</h3>
          <button onClick={() => testNavigation('/coach/dashboard')} style={{ margin: '5px' }}>Coach Dashboard</button>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.reload()} style={{ margin: '5px' }}>Reload Page</button>
        <button onClick={() => console.clear()} style={{ margin: '5px' }}>Clear Console</button>
      </div>
    </div>
  );
};

export default TestPage; 