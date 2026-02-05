import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetAuthState } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, loading, error } = useSelector((state) => state.auth);

  // Manual debug: Check your browser console to see if Redux is actually sending the error here
  useEffect(() => {
    if (error) console.log("Redux Error detected in Login.jsx:", error);
  }, [error]);

  useEffect(() => {
    if (user) navigate("/");
    dispatch(resetAuthState());
  }, [user, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(resetAuthState());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect w-full max-w-md p-8 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl animate-float" />
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gradient tracking-tight">
            Broke-O-Meter
          </h1>
          <p className="text-slate-400 mt-2 italic">
            Ready to face the financial consequences? 💸
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="login-error"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-brand-danger/10 border border-brand-danger/40 text-brand-danger text-sm flex items-start gap-3"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold uppercase text-[10px] tracking-widest opacity-70">Security Alert</span>
                <span className="font-medium">{String(error)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Identity</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-brand-primary transition-colors" size={18} />
              <input 
                name="email"
                type="text"
                required
                className="glass-input w-full pl-10"
                placeholder="Email or Username"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-brand-primary transition-colors" size={18} />
              <input 
                name="password"
                type="password"
                required
                className="glass-input w-full pl-10"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-brand-primary via-blue-600 to-brand-success hover:brightness-110 text-white font-bold py-4 rounded-2xl shadow-2xl shadow-blue-900/40 transform active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Enter the Vault"}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-primary font-bold hover:text-brand-success transition-colors">
            Sign up for free judgment.
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;