import React, { useState } from 'react';
import { auth, db } from '../../services/firebase';
// UPDATED: Import the sendPasswordResetEmail function
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { TECHNICIAN_SKILLS_OPTIONS } from '../../shared/constants';
import { MailIcon, LockClosedIcon, UserIcon, ArrowLeftIcon, SpinnerIcon, WrenchScrewdriverIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '../common/icons';

// UPDATED: Add a new 'forgot' mode
type AuthMode = 'login' | 'signup' | 'forgot';
type UserRole = 'technician' | 'customer';

interface AuthFlowProps {
  userType: UserRole;
  onBack: () => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ userType, onBack }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null); // NEW: State for success messages
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot'; // NEW: Helper for the new mode
  const roleName = userType.charAt(0).toUpperCase() + userType.slice(1);

  const handleSkillsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSkills(selectedOptions);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null); // NEW: Clear any previous success messages
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (isForgot) { // NEW: Handle the password reset logic
        if (!email) {
          setError("Please enter your email address.");
          setLoading(false);
          return;
        }
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent! Please check your inbox and spam folder.");
      } else { // Signup logic
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: fullName,
            email: user.email,
            role: userType,
            //avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
            avatarUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iY3VycmVudENvbG9yIiBjbGFzcz0idy02IGgtNiI+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNzUgMTkuMTI1YTUuMjUgNS4yNSAwIDAgMC0xMC41IDBWMTJBNi43NSA2Ljc1IDAgMCAwIDEyIDIuMjVDMTUuNzQyIDIuMjUgMTguNzUgNS4yNTggMTguNzUgOXYxMC4xMjV6TTguMjUgMTIuNzVhMy43NSAzLjc1IDAgMCAxIDcuNSAwVi43NWEzLjc1IDMuNzUgMCAwIDEtMy43NSAzLjc1QzkuOTk4IDQuNSA4LjI1IDYuMjQ4IDguMjUgOS43NXYzem0tLjAxIDYuMzdhNi43NSA2Ljc1IDAgMCAxIDYuNzYgMEMxOC4xNjIgMTkuMTIgMTkuNSA3LjY2MiAxOS41IDUuMjVoLTE1YzAgMi40MTIgMS4zMzggMTMuOTEyIDQuMjYgMEM4LjI0IDE5LjEyIDguMjUgMTkuMTIgOC4yNCAxOS4xMnptMTAuNTIgMi4yNGEuNzUuNzUgMCAwIDAtLjQ3IDEuMzEzbC0uMDM4LjAxN2E1Ljk4IDUuOTggMCAwIDEtOC41MDQgMGwtLjAzOC0uMDE3YS43NS43NSAwIDAgMC0uNDctMS4zMTJjLTIuODQ2LS4wNDMtNS4yMTUtMi4xMS01LjkyLTYuNjNhLjUuNSAwIDAgMSAuNDk4LS41NTZoMjAuMjYyYS41LjUgMCAwIDEgLjQ5OC41NTZjLS43MDUgNC41Mi0zLjA3NCA2LjU4Ny01LjkyIDYuNjN6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+Cjwvc3ZnPgo=`,
            skills: userType === 'technician' ? skills : null,
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Error creating user document in AuthFlow.tsx: ", dbError);
          setError("Failed to save user profile. Please try again.");
        }
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', '').replace('auth/', '').replace(/-/g, ' '));
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Function to switch between login, signup, and forgot modes
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setSkills([]);
  }

  // NEW: A dynamic title based on the current mode
  const getTitle = () => {
    if (isForgot) return 'Reset Password';
    return isLogin ? 'Sign In' : 'Create Account';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 relative animate-fade-in">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center font-semibold text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back to Welcome
      </button>

      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${userType === 'technician' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
            {roleName} Portal
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-800">{getTitle()}</h2>
          <p className="text-gray-500">
            {isForgot ? 'Enter your email to receive a password reset link.' : (isLogin ? `Enter your credentials to access the ${roleName} dashboard.` : `Join us to get started.`)}
          </p>
        </div>

        {/* NEW: If we have a success message, show it instead of the form */}
        {message ? (
          <div className="text-center p-4 bg-green-50 text-green-800 rounded-lg">
            <CheckCircleIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && !isForgot && (
              <>
                <div className="relative">
                  <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                {userType === 'technician' && (
                  <div className="relative">
                    <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <label htmlFor="skills-select" className="sr-only">Select your skills</label>
                    <select id="skills-select" multiple value={skills} onChange={handleSkillsChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                      {TECHNICIAN_SKILLS_OPTIONS.map((skill: string) => (<option key={skill} value={skill}>{skill}</option>))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1 pl-1">Hold Ctrl/Cmd to select multiple skills.</p>
                  </div>
                )}
              </>
            )}

            {/* Email input is shown in all modes */}
            <div className="relative">
              <MailIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>

            {/* Password input is hidden in forgot mode */}
            {!isForgot && (
              <div className="relative">
                <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required={!isForgot}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-6 h-6" />
                  ) : (
                    <EyeIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}

            {error && <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-lg capitalize">{error}</p>}

            {isLogin && (
              <button type="button" onClick={() => handleModeChange('forgot')} className="text-sm font-medium text-blue-600 hover:text-blue-700 float-right">Forgot Password?</button>
            )}

            <button type="submit" className="w-full flex justify-center items-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-blue-400" disabled={loading}>
              {loading ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : (isForgot ? 'Send Reset Link' : getTitle())}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {/* UPDATED: Buttons to switch between modes */}
            {isForgot ? (
              <button onClick={() => handleModeChange('login')} className="ml-2 font-semibold text-blue-600 hover:text-blue-700">
                Back to Sign In
              </button>
            ) : (
              <button onClick={() => handleModeChange(isLogin ? 'signup' : 'login')} className="ml-2 font-semibold text-blue-600 hover:text-blue-700">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;