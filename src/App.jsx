import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Signup from "./components/Signup";
import Login from "./components/login";
import PostCreator from "./components/PostCreator";
import PostsFeed from "./components/PostsFeed";
import UserProfile from "./components/profile";
import ProtectedRoute from "./components/ProtectedRoute";
import EditProfile from "./components/EditProfile";
import FloatingIsland from "./components/Menu";
import "./App.css";
import Stories from "./components/Stories";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  return (
    <Router>
      {user && (
  <FloatingIsland/>
      )}
      
      <Routes>
        
        {/* Home: if logged in show feed, otherwise redirect to login */}
        <Route
          path="/"
          element={
            user ? (
              <div className="feed-container">
                <Stories/>
                <PostsFeed />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path='/create-post' element={<PostCreator />}/>
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <div className="auth-container">
                <Signup />
              </div>
            )
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <div className="auth-container">
                <Login />
              </div>
            )
          }
        />
        

        {/* Protected profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <UserProfile />
            </ProtectedRoute>
          }
        />

         <Route
          path="/profile/:uid"
          element={<UserProfile isOwnProfile={false} />}
        />

        {/* Catch-all—redirect unknown URLs to home/login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
