export function getFirebaseAuthErrorMessage(error) {
  const code = error?.code || "";

  if (code === "auth/unauthorized-domain") {
    const host = typeof window !== "undefined" ? window.location.hostname : "current domain";
    return `Google sign-in is not enabled for this domain (${host}). Add this domain in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }

  if (code === "auth/popup-blocked") {
    return "Popup was blocked by the browser. Please allow popups and try again.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in popup was closed before completion.";
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Please check your internet connection and try again.";
  }

  return error?.message || "Authentication failed. Please try again.";
}
