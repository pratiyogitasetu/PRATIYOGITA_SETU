/**
 * Utility functions for input validation and sanitization
 */

// Sanitize HTML content to prevent XSS attacks
export const sanitizeHtml = (text) => {
  if (typeof text !== 'string') return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required' };
  if (password.length < 6) return { isValid: false, message: 'Password must be at least 6 characters' };
  if (password.length > 128) return { isValid: false, message: 'Password is too long' };

  return { isValid: true, message: '' };
};

// Validate display name
export const validateDisplayName = (name) => {
  if (!name) return { isValid: false, message: 'Display name is required' };
  if (name.length < 2) return { isValid: false, message: 'Display name must be at least 2 characters' };
  if (name.length > 50) return { isValid: false, message: 'Display name is too long' };

  // Check for potentially harmful characters
  const dangerousChars = /<script|javascript:|on\w+=/i;
  if (dangerousChars.test(name)) {
    return { isValid: false, message: 'Display name contains invalid characters' };
  }

  return { isValid: true, message: '' };
};
