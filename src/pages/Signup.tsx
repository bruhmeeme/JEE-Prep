import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loginMock } = useAuth();
  
  if (user) {
      return <Navigate to="/" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.length < 3) {
        setError('Username must be at least 3 characters.');
        setLoading(false);
        return;
    }
    
    if (cleanUsername.includes(' ')) {
        setError('Username cannot contain spaces.');
        setLoading(false);
        return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
    }

    try {
        if (!auth || !db) {
            // Defensive mock pathway if Firebase isn't natively bound yet
            console.warn("Using mock robust auth simulation due to environment status.");
            const usersJson = localStorage.getItem('jeecommand_mock_users');
            const users = usersJson ? JSON.parse(usersJson) : {};
            
            if (users[cleanUsername]) {
                setError('Username is already taken.');
                setLoading(false);
                return;
            }
            
            // Simple robust mock creation
            users[cleanUsername] = { password, createdAt: new Date().toISOString() };
            localStorage.setItem('jeecommand_mock_users', JSON.stringify(users));
            loginMock(cleanUsername);
            return;
        }

        // Real Firebase flow
        // 1. Check if username exists globally
        const usernameDoc = await getDoc(doc(db, "usernames", cleanUsername));
        if (usernameDoc.exists()) {
            setError('Username is already taken.');
            setLoading(false);
            return;
        }

        // 2. Create user with dummy email alias
        const dummyEmail = `${cleanUsername}@jeecommand.app`;
        const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, password);
        const user = userCredential.user;

        // 3. Create global username lookup map
        await setDoc(doc(db, "usernames", cleanUsername), {
            uid: user.uid,
            email: dummyEmail
        });

        // 4. Provision secure user profile document setup
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        await setDoc(doc(db, "users", user.uid), {
            username: cleanUsername,
            examDate: oneYearFromNow,
            dailyStudyGoalMinutes: 240,
            createdAt: serverTimestamp()
        });
        
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
            setError('Username is already taken.'); // Our internal proxy mapping
        } else {
            setError(err.message || 'Failed to create an account.');
        }
        setLoading(false);
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
          <p className="text-sm text-gray-400 mt-2">Initialize Mission Parameters</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && <div className="p-3 text-sm rounded bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="username">Choose a Username</Label>
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
                {loading ? 'Initializing...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-brand hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
