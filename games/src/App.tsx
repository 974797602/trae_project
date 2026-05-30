import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useGameStore, initializeFromStorage } from "@/store/useGameStore";
import { Login } from "@/pages/Login";
import { Lobby } from "@/pages/Lobby";
import { Room } from "@/pages/Room";
import { GameArena } from "@/pages/GameArena";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useGameStore(state => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    initializeFromStorage();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Lobby />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/room/:roomId" 
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/game/:roomId" 
            element={
              <ProtectedRoute>
                <GameArena />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
