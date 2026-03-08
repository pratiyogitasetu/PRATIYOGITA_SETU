import React from "react";
import { Navigate } from "react-router-dom";

/** Signup page — Firebase auth removed. Redirects to home. */
const Signup = () => <Navigate to="/" replace />;

export default Signup;