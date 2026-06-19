import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loginMock } = useAuth();
  
  if (user) {
      return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername || !password) {
         setError('Please enter both username and password.');
         setLoading(false);
         return;
    }

    try {
        if (!auth) {
            // Defensive mock pathway if Firebase isn't natively bound yet
            const usersJson = localStorage.getItem('jeecommand_mock_users');
            const users = usersJson ? JSON.parse(usersJson) : {};
            if (!users[cleanUsername] || users[cleanUsername].password !== password) {
                setError('Invalid username or password.');
                setLoading(false);
                return;
            }
            loginMock(cleanUsername);
            return;
        }

        const dummyEmail = `${cleanUsername}@jeecommand.app`;
        await signInWithEmailAndPassword(auth, dummyEmail, password);
        // Navigation is handled automatically by AuthContext observer tracking user change
    } catch (err: any) {
         setError('Invalid username or password.');
    } finally {
        if (!auth) setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-bg-base">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-100 flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-md bg-brand"></span>
            JEE Prep
          </h1>
          <p className="text-sm text-gray-400 mt-2">Sign in to Mission Control</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 text-sm rounded bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. aryan_prep"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-brand hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
