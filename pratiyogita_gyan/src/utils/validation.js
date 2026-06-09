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
    .replace(/"/g, '&quot;')
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

// Validate search query
export const validateSearchQuery = (query) => {
  if (!query) return { isValid: false, message: 'Please ask a question', suggestions: ['Tell me about Ganga river', 'What is photosynthesis?', 'Explain Newton\'s laws'] };
  if (query.length < 2) return { isValid: false, message: 'Please ask a complete question', suggestions: ['Tell me about Ganga river', 'Explain democracy', 'What is mitosis?'] };
  if (query.length > 1000) return { isValid: false, message: 'Question is too long (max 1000 characters)' };
  
  return { isValid: true, message: '' };
};

// Validate chat title
export const validateChatTitle = (title) => {
  if (!title) return { isValid: false, message: 'Chat title is required' };
  if (title.length > 100) return { isValid: false, message: 'Chat title is too long' };
  
  return { isValid: true, message: '' };
};

// Throttle function to prevent excessive API calls
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Debounce function for search input
export const debounce = (func, delay) => {
  let timeoutId;
  return function() {
    const args = arguments;
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
};
