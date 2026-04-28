import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Eye, EyeOff, Loader2, Lock, Mail, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        if (!fullName.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        await register(email.trim(), password, fullName.trim());
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center relative">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 shadow-[0_0_30px_hsl(142,71%,45%,0.15)]">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">LockLab<span className="text-primary">NBA</span></h1>
        <p className="text-sm text-muted-foreground mt-2">AI-powered props intelligence</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm relative">
        <div className="bg-[hsl(222,47%,9%)] border border-white/8 rounded-2xl p-6 shadow-2xl">
          {/* Tab toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={cn(
                  "flex-1 text-sm font-semibold py-2 rounded-lg transition-all",
                  mode === m
                    ? "bg-white/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Your name" required className={inputClass} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                  required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={cn(inputClass, "pr-11")} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_hsl(142,71%,45%,0.2)]">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/60 text-center max-w-xs leading-relaxed">
        Your account syncs parlay history and favorites across devices.
      </p>
    </div>
  );
}
