import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";

const NOTICE_CONSENT_VERSION = "v1";

function hasNoticeConsent(profileData) {
  return (
    profileData?.serviceNoticeConsent?.accepted === true ||
    profileData?.noticeConsentAccepted === true
  );
}

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConsentStatus() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const profileRef = doc(db, "users", currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.exists() ? profileSnap.data() : {};

        if (!cancelled) {
          setConsentAccepted(hasNoticeConsent(profileData));
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to verify notice consent. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConsentStatus();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const handleConsentSubmit = async () => {
    if (!currentUser || !checkboxChecked) return;

    setSaving(true);
    setError("");

    try {
      const profileRef = doc(db, "users", currentUser.uid);
      await setDoc(
        profileRef,
        {
          serviceNoticeConsent: {
            accepted: true,
            acceptedAt: serverTimestamp(),
            version: NOTICE_CONSENT_VERSION,
          },
          noticeConsentAccepted: true,
          noticeConsentAcceptedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setConsentAccepted(true);
    } catch (err) {
      setError("Failed to save consent. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <CircularProgress sx={{ color: "#E4572E" }} />
      </Box>
    );
  }

  if (consentAccepted) {
    return children;
  }

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          bgcolor: "#2B1E17",
          color: "#FBF6EE",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "#2B1E17",
          color: "#FBF6EE",
          py: 1,
          px: 2,
          borderBottom: "1px solid rgba(228,87,46,0.35)",
        }}
      >
        <Typography variant="subtitle1" component="span" fontWeight="bold">
          Important Notice
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5, pb: 1.25, bgcolor: "#2B1E17" }}>
        <div className="space-y-2.5">
          <div className="bg-[#E4572E]/10 border-l-2 border-[#E4572E] p-2.5 rounded-r-lg">
            <Typography variant="subtitle1" className="text-[#FBF6EE] font-bold mb-1">
              Welcome to Pratiyogita Yogya
            </Typography>
            <Typography variant="body2" className="text-[#E8D8C3] leading-snug text-[12px]">
              This platform helps you quickly check exam eligibility based on the information you enter.
              Our goal is to save your time by giving a clear first-level eligibility view before you apply.
            </Typography>
          </div>

          <div className="bg-green-500/10 border-l-2 border-green-500 p-2.5 rounded-r-lg">
            <Typography variant="subtitle2" className="text-green-400 font-bold mb-1">
              Data Privacy and Security
            </Typography>
            <Typography variant="body2" className="text-green-300 leading-snug text-[12px]">
              We do not sell your data or use it for fraudulent activities.
              Your details are used only for eligibility-related workflows and platform features.
              Please enter only required information and avoid sharing unnecessary sensitive data.
            </Typography>
          </div>

          <div className="bg-yellow-500/10 border-l-2 border-yellow-500 p-2.5 rounded-r-lg">
            <Typography variant="subtitle2" className="text-yellow-400 font-bold mb-1">
              Eligibility Criteria Disclaimer
            </Typography>
            <Typography variant="body2" className="text-yellow-300 leading-snug text-[12px]">
              The result shown here is based on the criteria currently available in our system and is for guidance only.
              Exam authorities may update rules such as age limits, category relaxations,
              post-wise requirements, and document conditions at any time.
            </Typography>
          </div>

          <div className="bg-purple-500/10 border-l-2 border-purple-500 p-2.5 rounded-r-lg">
            <Typography variant="subtitle2" className="text-purple-400 font-bold mb-1">
              Official Notification
            </Typography>
            <Typography variant="body2" className="text-purple-300 leading-snug text-[12px]">
              Always refer to the latest official exam notification, corrigendum, and official website instructions.
              If any difference exists between this platform and the official notice,
              the official notification will always be treated as final.
            </Typography>
          </div>
        </div>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            sx={{ alignItems: "flex-start", mr: 0 }}
            control={
              <Checkbox
                checked={checkboxChecked}
                onChange={(event) => setCheckboxChecked(event.target.checked)}
                sx={{
                  color: "rgba(232,216,195,0.8)",
                  "&.Mui-checked": { color: "#E4572E" },
                  mt: "2px",
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: "rgba(251,246,238,0.92)", lineHeight: 1.4 }}>
                I have read and agree to this notice.
              </Typography>
            }
          />
          {error && (
            <Typography variant="caption" sx={{ color: "#ff8a80", display: "block", mt: 0.5 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, justifyContent: "center", bgcolor: "#2B1E17" }}>
        <Button
          onClick={handleConsentSubmit}
          disabled={!checkboxChecked || saving}
          variant="contained"
          sx={{
            background: "linear-gradient(135deg, #E4572E 0%, #c9421e 100%)",
            borderRadius: "8px",
            px: 3,
            py: 0.65,
            textTransform: "none",
            fontWeight: "bold",
            fontSize: "0.85rem",
          }}
        >
          {saving ? "Saving..." : "I Agree and Continue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
