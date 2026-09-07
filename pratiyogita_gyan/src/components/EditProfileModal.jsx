import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Check,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Cloud,
  Trash2,
  Phone,
  FileText,
  Mail,
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AVATAR_PRESETS, getAvatarSvgDataUrl, findAvatarById } from '../utils/avatarPresets'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../config/firebase'

const EditProfileModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    updateProfileDetails,
    getUserProfile,
    sendResetPasswordEmail,
    deleteUserAccount,
    logout
  } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState('avatar_initials')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)

  // Delete account safety confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Determine auth provider (Google vs Password)
  const isGoogleUser = currentUser?.providerData?.some((p) => p.providerId === 'google.com')
  const isEmailVerified = currentUser?.emailVerified || isGoogleUser

  // Load existing profile details from Firestore & Auth
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!isOpen || !currentUser) return

      setError(null)
      setSuccessMsg('')
      setResetSent(false)
      setShowDeleteConfirm(false)
      setDeleteInput('')

      setDisplayName(currentUser.displayName || '')

      try {
        const firestoreData = await getUserProfile(currentUser.uid)
        if (!isMounted) return

        if (firestoreData) {
          if (firestoreData.bio) setBio(firestoreData.bio)
          if (firestoreData.phone) setPhone(firestoreData.phone)
          if (firestoreData.avatarId) {
            setSelectedAvatarId(firestoreData.avatarId)
          } else if (currentUser.photoURL && currentUser.photoURL.startsWith('data:image/svg')) {
            // Check if matches an existing preset
            const matched = AVATAR_PRESETS.find((a) => getAvatarSvgDataUrl(a.svg) === currentUser.photoURL)
            if (matched) setSelectedAvatarId(matched.id)
            else setSelectedAvatarId('avatar_initials')
          } else {
            setSelectedAvatarId('avatar_initials')
          }
        }
      } catch (err) {
        console.warn('Could not load extra user profile fields:', err)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [isOpen, currentUser])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Get user initials for display
  const getUserInitials = (name) => {
    const target = name || currentUser?.displayName || currentUser?.email || 'PG'
    const clean = target.replace(/[^a-zA-Z0-9 ]/g, '').trim()
    const parts = clean.split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return clean.slice(0, 2).toUpperCase() || 'PG'
  }

  // Calculate current avatar preview
  const currentPreset = findAvatarById(selectedAvatarId)

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!currentUser?.email) return
    setSendingReset(true)
    setError(null)
    try {
      if (sendResetPasswordEmail) {
        await sendResetPasswordEmail(currentUser.email)
      }
      setResetSent(true)
      setTimeout(() => setResetSent(false), 8000)
    } catch (err) {
      console.error('Password reset failed:', err)
      setError(err.message || 'Failed to send password reset email.')
    } finally {
      setSendingReset(false)
    }
  }

  // Handle email verification send
  const handleSendVerification = async () => {
    if (!auth.currentUser) return
    setSendingVerification(true)
    setError(null)
    try {
      await sendEmailVerification(auth.currentUser)
      setVerificationSent(true)
      setTimeout(() => setVerificationSent(false), 8000)
    } catch (err) {
      console.error('Email verification error:', err)
      setError(err.message || 'Failed to send verification email.')
    } finally {
      setSendingVerification(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toUpperCase() !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion.')
      return
    }

    setDeleting(true)
    setError(null)
    try {
      if (deleteUserAccount) {
        await deleteUserAccount()
      }
      onClose()
      window.location.reload()
    } catch (err) {
      console.error('Account deletion error:', err)
      setError(err.message || 'Could not delete account. You may need to sign out and log in again before deleting.')
      setDeleting(false)
    }
  }

  // Submit Profile Changes
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg('')

    try {
      let finalPhotoURL = ''
      if (selectedAvatarId !== 'avatar_initials') {
        const preset = findAvatarById(selectedAvatarId)
        if (preset) {
          finalPhotoURL = getAvatarSvgDataUrl(preset.svg)
        }
      }

      await updateProfileDetails({
        displayName: displayName.trim(),
        avatarId: selectedAvatarId,
        photoURL: finalPhotoURL,
        bio: bio.trim(),
        phone: phone.trim()
      })

      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => {
        onClose()
      }, 700)
    } catch (err) {
      console.error('Failed to update profile', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#E4572E]/20 border border-[#E4572E]/40 flex items-center justify-center text-[#E4572E]">
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Cloud Sync Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="text-xs font-semibold">
                <span className="text-emerald-900">Firebase Cloud Sync: </span>
                <span className="text-emerald-700 font-bold">All progress safely synced</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/60 font-mono text-emerald-800 font-semibold">
              Live
            </span>
          </div>

          {/* Active Profile Snapshot Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-orange-50/30 border border-gray-200">
            {/* Live Avatar Preview */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md overflow-hidden transition-all duration-300 ring-4 ring-white"
                style={{
                  background: currentPreset ? currentPreset.bg : 'linear-gradient(135deg, #E4572E, #ea580c)'
                }}
              >
                {selectedAvatarId === 'avatar_initials' || !currentPreset ? (
                  <span className="text-2xl font-extrabold text-white tracking-wider">
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
              <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-1 rounded-lg shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>

            {/* User Meta Info & Email Badge */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {displayName || 'Aspirant'}
                </h3>
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 font-mono truncate mb-2">
                {currentUser?.email || 'No email attached'}
              </p>

              <p className="text-xs text-gray-600 line-clamp-2 italic">
                "{bio || 'No bio added yet. Add your study quote or target exam below!'}"
              </p>
            </div>
          </div>

          {/* Section 1: Ready-made Student/Aspirant Avatars */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Choose Aspirant Avatar
              </label>
              <span className="text-[11px] text-gray-500 font-medium">
                12 Presets + My Initials
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 max-h-56 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
              {/* Option 0: Initials Option */}
              <button
                type="button"
                onClick={() => setSelectedAvatarId('avatar_initials')}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  selectedAvatarId === 'avatar_initials'
                    ? 'ring-2 ring-[#E4572E] bg-orange-100/50 shadow-xs'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                }`}
                title="Use Name Initials"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E4572E] to-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                  {getUserInitials(displayName)}
                </div>
                <span className="text-[10px] font-semibold text-gray-700 mt-1 truncate w-full text-center">
                  Initials
                </span>
                {selectedAvatarId === 'avatar_initials' && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E4572E] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* 12 Presets */}
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatarId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(preset.id)}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#E4572E] bg-orange-100/50 shadow-xs scale-102'
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                    title={`${preset.name} (${preset.tag})`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center"
                      style={{ background: preset.bg }}
                    >
                      <img
                        src={getAvatarSvgDataUrl(preset.svg)}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700 mt-1 truncate w-full text-center">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E4572E] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Display Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Name / Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E4572E] focus:border-transparent transition-all"
                  placeholder="e.g. Arjun Sharma"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Phone / WhatsApp Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                  className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E4572E] focus:border-transparent transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bio (Limit 200 Characters) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Aspirant Bio / Study Quote
              </label>
              <span
                className={`text-[11px] font-mono ${
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
              rows={3}
              className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E4572E] focus:border-transparent transition-all resize-none leading-relaxed"
              placeholder="e.g. Mission UPSC CSE 2026 | Daily 50 PYQs revision goal | Dream LBSNAA"
            />
          </div>

          {/* Section 4: Email & Account Security (Password Management) */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-gray-700" />
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Account Security & Password
                </h4>
              </div>
            </div>

            {/* If Google SSO: show info notice */}
            {isGoogleUser ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Signed in via Google SSO:</span>
                  Your password and credentials are securely managed directly through your Google account ({currentUser?.email}). No separate password needed.
                </div>
              </div>
            ) : (
              /* If Email/Password: show Reset Password button */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg bg-white border border-gray-200">
                <div className="text-xs text-gray-700">
                  <span className="font-bold block text-gray-900">Change or Reset Password:</span>
                  We will email you a secure link to reset your account password.
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={sendingReset || resetSent}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors shrink-0 disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{resetSent ? 'Email Sent ✓' : sendingReset ? 'Sending...' : 'Send Reset Link'}</span>
                </button>
              </div>
            )}

            {resetSent && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password reset link sent to {currentUser?.email}. Please check your inbox and spam folder.</span>
              </div>
            )}

            {/* Email Verification Option if not verified */}
            {!isEmailVerified && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                <div>
                  <span className="font-bold text-amber-900 block">Email Not Verified:</span>
                  Verify your email to ensure uninterrupted access.
                </div>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={sendingVerification || verificationSent}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shrink-0 text-xs"
                >
                  {verificationSent ? 'Link Sent ✓' : sendingVerification ? 'Sending...' : 'Verify Email'}
                </button>
              </div>
            )}

            {verificationSent && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                Verification email sent! Check your inbox.
              </div>
            )}
          </div>

          {/* Section 5: Danger Zone (Delete Account) */}
          <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                <Trash2 className="w-4 h-4" />
                <span>Danger Zone: Account Deletion</span>
              </div>
              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors border border-red-300"
                >
                  Delete Account
                </button>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="p-3 bg-white rounded-lg border border-red-200 space-y-2 mt-2">
                <p className="text-xs text-red-700 font-medium">
                  ⚠️ <strong>Warning:</strong> Deleting your account will permanently delete all your chat histories, question statistics, and saved PYQs. This cannot be undone.
                </p>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-600 block">
                    Type <strong>DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full border border-red-300 rounded-md px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteInput.trim().toUpperCase() !== 'DELETE' || deleting}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteInput('')
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-xs text-green-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#E4572E] text-white hover:bg-[#c9451e] shadow-sm hover:shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfileModal
