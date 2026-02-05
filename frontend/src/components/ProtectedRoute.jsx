import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Show a stylish loader while checking if the user is a "known spender"
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
        <p className="text-slate-400 italic animate-pulse">
          Consulting the financial oracle...
        </p>
      </div>
    );
  }

  // No user found? Back to the login screen you go.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;