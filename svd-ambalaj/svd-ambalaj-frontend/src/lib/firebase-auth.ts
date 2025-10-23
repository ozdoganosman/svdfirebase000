import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebase-client";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Create a new user account
 */
export const signUp = async (data: SignUpData): Promise<UserCredential> => {
  const { email, password, name } = data;
  
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: name,
    });
  }

  return userCredential;
};

/**
 * Sign in existing user
 */
export const signIn = async (data: SignInData): Promise<UserCredential> => {
  const { email, password } = data;
  return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};
