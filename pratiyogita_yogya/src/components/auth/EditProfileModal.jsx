import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Check,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Trash2,
  Mail,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AVATAR_PRESETS, getAvatarSvgDataUrl, findAvatarById } from '../../utils/avatarPresets';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase';

const EditProfileModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    updateProfileDetails,
    getUserProfile,
    sendResetPasswordEmail,
    deleteUserAccount
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('avatar_initials');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  // Delete account safety confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Determine auth provider (Google vs Password)
  const isGoogleUser = currentUser?.providerData?.some((p) => p.providerId === 'google.com');
  const isEmailVerified = currentUser?.emailVerified || isGoogleUser;

  // Load existing profile details from Firestore & Auth
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isOpen || !currentUser) return;

      setError(null);
      setSuccessMsg('');
      setResetSent(false);
      setShowDeleteConfirm(false);
      setDeleteInput('');

      setDisplayName(currentUser.displayName || '');

      try {
        const firestoreData = await getUserProfile(currentUser.uid);
        if (!isMounted) return;

        if (firestoreData) {
          if (firestoreData.bio) setBio(firestoreData.bio);
          if (firestoreData.phone) setPhone(firestoreData.phone);
          if (firestoreData.avatarId) {
            setSelectedAvatarId(firestoreData.avatarId);
          } else if (currentUser.photoURL && currentUser.photoURL.startsWith('data:image/svg')) {
            const matched = AVATAR_PRESETS.find((a) => getAvatarSvgDataUrl(a.svg) === currentUser.photoURL);
            if (matched) setSelectedAvatarId(matched.id);
            else setSelectedAvatarId('avatar_initials');
          } else {
            setSelectedAvatarId('avatar_initials');
          }
        }
      } catch (err) {
        console.warn('Could not load extra user profile fields:', err);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getUserInitials = (name) => {
    const target = name || currentUser?.displayName || currentUser?.email || 'PY';
    const clean = target.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'PY';
  };

  const currentPreset = findAvatarById(selectedAvatarId);

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    setSendingReset(true);
    setError(null);
    try {
      if (sendResetPasswordEmail) {
        await sendResetPasswordEmail(currentUser.email);
      }
      setResetSent(true);
      setTimeout(() => setResetSent(false), 8000);
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSendVerification = async () => {
    if (!auth.currentUser) return;
    setSendingVerification(true);
    setError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 8000);
    } catch (err) {
      console.error('Email verification failed:', err);
      setError(err.message || 'Failed to send verification email.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUserAccount();
      onClose();
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err.message || 'Failed to delete account. You may need to sign in again first.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      let finalPhotoURL = '';
      if (selectedAvatarId === 'avatar_initials') {
        finalPhotoURL = '';
      } else {
        const preset = findAvatarById(selectedAvatarId);
        if (preset) {
          finalPhotoURL = getAvatarSvgDataUrl(preset.svg);
        }
      }

      await updateProfileDetails({
        displayName: displayName.trim(),
        photoURL: finalPhotoURL,
        avatarId: selectedAvatarId,
        bio: bio.trim(),
        phone: phone.trim()
      });

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update profile', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col my-auto max-h-[95vh] md:max-h-none md:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E4572E]/20 border border-[#E4572E]/40 flex items-center justify-center text-[#E4572E]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Aspirant Profile & Settings</h2>
              <p className="text-xs text-gray-400">Personalize your learning persona and manage account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop 2-Column Grid Form - Zero Scroll on Desktop */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto md:overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* Left Column (5 cols): Live Profile Snapshot & Avatar Presets */}
            <div className="md:col-span-5 space-y-3">
              {/* Snapshot Card */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-orange-50/30 border border-gray-200 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-xs overflow-hidden ring-2 ring-white"
                    style={{
                      background: currentPreset ? currentPreset.bg : 'linear-gradient(135deg, #E4572E, #ea580c)'
                    }}
                  >
                    {selectedAvatarId === 'avatar_initials' || !currentPreset ? (
                      <span className="text-lg font-extrabold text-white tracking-wider">
                        {getUserInitials(displayName)}
                      </span>
                    ) : (
                      <img
                        src={getAvatarSvgDataUrl(currentPreset.svg)}
                        alt={currentPreset.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-0.5 rounded-md shadow-xs">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs font-bold text-gray-900 truncate max-w-[130px]">
                      {displayName || 'Aspirant'}
                    </h3>
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                        <span>Unverified</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono truncate mt-0.5">
                    {currentUser?.email || 'No email'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Firebase Cloud Synced
                  </p>
                </div>
              </div>

              {/* Avatar Selector Grid */}
              <div className="p-3 bg-gray-50/90 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Choose Avatar
                  </label>
                  <span className="text-[10px] text-gray-500">
                    12 Presets + Initials
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {/* Initials */}
                  <button
                    type="button"
                    onClick={() => setSelectedAvatarId('avatar_initials')}
                    className={`relative p-1 rounded-lg flex flex-col items-center justify-center transition-all ${
                      selectedAvatarId === 'avatar_initials'
                        ? 'ring-2 ring-[#E4572E] bg-orange-100/60 shadow-xs'
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                    title="Name Initials"
                  >
                    <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#E4572E] to-amber-500 flex items-center justify-center text-white font-extrabold text-[10px]">
                      {getUserInitials(displayName)}
                    </div>
                    <span className="text-[9px] font-semibold text-gray-700 mt-0.5 truncate w-full text-center">
                      Initials
                    </span>
                    {selectedAvatarId === 'avatar_initials' && (
                      <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#E4572E] text-white flex items-center justify-center">
                        <Check className="w-2 h-2 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* 12 Presets */}
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatarId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedAvatarId(preset.id)}
                        className={`relative p-1 rounded-lg flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#E4572E] bg-orange-100/60 shadow-xs'
                            : 'bg-white hover:bg-gray-100 border border-gray-200'
                        }`}
                        title={`${preset.name} (${preset.tag})`}
                      >
                        <div
                          className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center"
                          style={{ background: preset.bg }}
                        >
                          <img
                            src={getAvatarSvgDataUrl(preset.svg)}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[9px] font-semibold text-gray-700 mt-0.5 truncate w-full text-center">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#E4572E] text-white flex items-center justify-center">
                            <Check className="w-2 h-2 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Inputs, Bio, Security, Danger Zone */}
            <div className="md:col-span-7 space-y-3">
              {/* Full Name & Phone in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#E4572E] focus:border-transparent transition-all"
                    placeholder="e.g. Arjun Sharma"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={15}
                    className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#E4572E] focus:border-transparent transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Bio (Limit 200 Characters) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Aspirant Bio / Study Quote
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      bio.length > 180 ? 'text-amber-600 font-bold' : 'text-gray-400'
                    }`}
                  >
                    {bio.length} / 200
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={2}
                  className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#E4572E] focus:border-transparent transition-all resize-none leading-relaxed"
                  placeholder="e.g. Mission UPSC CSE 2026 | Daily 50 PYQs revision goal"
                />
              </div>

              {/* Account Security & Password */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-gray-700" />
                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                      Account Security
                    </span>
                  </div>

                  {isGoogleUser ? (
                    <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-600" />
                      Google SSO Managed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={sendingReset || resetSent}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors shrink-0 disabled:opacity-60 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>{resetSent ? 'Email Sent ✓' : sendingReset ? 'Sending...' : 'Reset Password'}</span>
                    </button>
                  )}
                </div>

                {!isEmailVerified && (
                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-amber-800 font-medium">Email not verified</span>
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      disabled={sendingVerification || verificationSent}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px]"
                    >
                      {verificationSent ? 'Link Sent ✓' : sendingVerification ? 'Sending...' : 'Verify Now'}
                    </button>
                  </div>
                )}
              </div>

              {/* Danger Zone (Delete Account) */}
              <div className="p-2.5 rounded-xl bg-red-50/60 border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold text-[11px] uppercase tracking-wider">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Danger Zone</span>
                  </div>
                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-2 py-0.5 text-[10px] font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded border border-red-300 transition-colors"
                    >
                      Delete Account
                    </button>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="p-2.5 bg-white rounded-lg border border-red-200 space-y-1.5 mt-2">
                    <p className="text-[11px] text-red-700 leading-snug">
                      Type <strong>DELETE</strong> to permanently remove your account:
                    </p>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="DELETE"
                      className="w-full border border-red-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <div className="flex gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteInput.trim().toUpperCase() !== 'DELETE' || deleting}
                        className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteInput('');
                        }}
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-[11px] font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-1.5 text-[11px] text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2 rounded-lg bg-green-50 border border-green-200 flex items-center gap-1.5 text-[11px] text-green-800">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 mt-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-5 rounded-xl text-xs font-bold bg-[#E4572E] text-white hover:bg-[#c9451e] shadow-xs transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
