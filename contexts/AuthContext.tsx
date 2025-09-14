import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

// Step 1: Define the shape of our user profile data from Firestore.
// This should match the structure we defined in Phase 1.
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'customer' | 'technician';
  avatarUrl: string;
  skills?: string[]; // Optional, only for technicians
}

// Step 2: Define the shape of the data our context will provide.
interface AuthContextType {
  user: User | null; // The raw user object from Firebase Auth
  userProfile: UserProfile | null; // The user's profile data from Firestore
  loading: boolean; // A flag to know when we are checking for authentication
}

// Step 3: Create the actual context with a default value.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Step 4: Create the Provider component. This is the component that will wrap our app.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is a real-time listener from Firebase.
    // It runs once on initial load, and then every time the user logs in or out.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in.
        setUser(firebaseUser);
        
        // Now, fetch their profile from the 'users' collection in Firestore.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            // The profile document was found.
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // This is a debuggable error case. It means the user is authenticated
            // but their profile document is missing in Firestore.
            console.error(`AuthContext.tsx: No profile document found for user with UID: ${firebaseUser.uid}`);
            setUserProfile(null); // Ensure no stale profile data
          }
        } catch (error) {
            console.error("AuthContext.tsx: Error fetching user profile:", error);
            setUserProfile(null);
        }

      } else {
        // User is logged out. Reset all states.
        setUser(null);
        setUserProfile(null);
      }
      // Finished the initial check.
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts to prevent memory leaks.
    return () => unsubscribe();
  }, []); // The empty dependency array means this effect runs only once on mount.

  // The value that will be available to all children components.
  const value = { user, userProfile, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Step 5: Create a custom hook for easy access to the context's data.
// This is a best practice to avoid importing `useContext` and `AuthContext` everywhere.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};