import React from "react";
import { Navigate } from "react-router-dom";

/** Login page — Firebase auth removed. Redirects to home. */
const Login = () => <Navigate to="/" replace />;

export default Login;