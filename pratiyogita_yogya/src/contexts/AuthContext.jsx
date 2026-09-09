import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile,
    deleteUser
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, name) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (name) {
            await updateProfile(user, {
                displayName: name
            });
        }
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: name || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        return userCredential;
    }

    async function login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user.displayName) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const docDisplayName = userDoc.exists() ? String(userDoc.data()?.displayName || '').trim() : '';
            if (docDisplayName) {
                await updateProfile(user, { displayName: docDisplayName });
            }
        }
        return userCredential;
    }

    function logout() {
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    async function sendResetPasswordEmailLink(targetEmail) {
        const emailToSend = targetEmail || currentUser?.email;
        if (!emailToSend) {
            throw new Error('No email found to send password reset');
        }
        return await sendPasswordResetEmail(auth, emailToSend);
    }

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                provider: 'google'
            });
        }
        return result;
    }

    // Get extended user profile from Firestore
    async function getUserProfile(uid = currentUser?.uid) {
        if (!uid) return null;
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (err) {
            console.warn('Failed to load user profile from Firestore:', err);
            return null;
        }
    }

    // Update user auth profile and Firestore user document
    async function updateProfileDetails({ displayName, photoURL, avatarId, bio, phone }) {
        if (!currentUser) return null;

        try {
            const authUpdates = {};
            if (displayName !== undefined) authUpdates.displayName = displayName;
            if (photoURL !== undefined) authUpdates.photoURL = photoURL;

            if (Object.keys(authUpdates).length > 0 && auth.currentUser) {
                await updateProfile(auth.currentUser, authUpdates);
            }

            const userRef = doc(db, 'users', currentUser.uid);
            const firestoreData = {
                updatedAt: serverTimestamp()
            };
            if (displayName !== undefined) firestoreData.displayName = displayName;
            if (photoURL !== undefined) firestoreData.photoURL = photoURL;
            if (avatarId !== undefined) firestoreData.avatarId = avatarId;
            if (bio !== undefined) firestoreData.bio = bio;
            if (phone !== undefined) firestoreData.phone = phone;

            await setDoc(userRef, firestoreData, { merge: true });

            // Refresh local currentUser state
            if (auth.currentUser) {
                setCurrentUser((prev) => ({
                    ...(prev || auth.currentUser),
                    ...authUpdates,
                    avatarId,
                    bio,
                    phone
                }));
            }
            return true;
        } catch (error) {
            console.error('Error updating profile in Yogya:', error);
            throw error;
        }
    }

    // Delete user account and their user data
    async function deleteUserAccount() {
        if (!currentUser || !auth.currentUser) {
            throw new Error('No user currently authenticated');
        }
        const uid = currentUser.uid;
        try {
            await deleteDoc(doc(db, 'users', uid));
            await deleteUser(auth.currentUser);
            setCurrentUser(null);
        } catch (err) {
            console.error('Error deleting user account:', err);
            throw err;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setCurrentUser({
                            ...user,
                            avatarId: data.avatarId || null,
                            bio: data.bio || '',
                            phone: data.phone || '',
                            displayName: user.displayName || data.displayName || '',
                            photoURL: user.photoURL || data.photoURL || ''
                        });
                    } else {
                        setCurrentUser(user);
                    }
                } catch (err) {
                    console.warn('Error fetching initial user doc:', err);
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout,
        resetPassword,
        sendResetPasswordEmail: sendResetPasswordEmailLink,
        loginWithGoogle,
        getUserProfile,
        updateProfileDetails,
        deleteUserAccount
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
