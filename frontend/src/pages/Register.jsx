import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Loader2, Rocket } from "lucide-react";
import { registerUser, resetAuthState } from "../features/auth/authSlice";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Connect to Redux state
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    if (success) {
      dispatch(resetAuthState()); // Clean up state before leaving
      navigate("/login");
    }
  }, [success, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect w-full max-w-md p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Join the Club 🥂</h1>
          <p className="text-slate-400 mt-2 italic">
            Create an account to track where your money disappears.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ x: -10 }} animate={{ x: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm text-slate-300 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="text"
                required
                className="glass-input w-full pl-10"
                placeholder="naimonweb"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="email"
                required
                className="glass-input w-full pl-10"
                placeholder="naim@example.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="password"
                required
                className="glass-input w-full pl-10"
                placeholder="Make it strong!"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Rocket size={18}/> Start Tracking</>}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400 text-sm">
          Already a member?{" "}
          <Link to="/login" className="text-emerald-400 hover:underline">Log in and face the truth.</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;