/**
 * API Service for communicating with the Flask backend
 */

// Production-safe API URL configuration
const getApiBaseUrl = () => {
  // In production, VITE_API_BASE_URL is REQUIRED
  if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL must be set in production environment. ' +
      'Please configure this in your Vercel deployment settings.'
    );
  }

  // Development: use proxy
  if (import.meta.env.DEV) {
    return '/api';
  }

  // Production: use configured URL
  return `${import.meta.env.VITE_API_BASE_URL}/api`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    if (import.meta.env.DEV) {
      console.log(`🔗 API Service initialized with base URL: ${this.baseUrl}`);
    }
  }

  /**
   * Make a generic API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Check if it's a CORS issue
        if (error.message.includes('cors') || error.message.toLowerCase().includes('network')) {
          console.warn('🚨 CORS or Network Error detected. Backend may not be running or CORS not configured properly.');
        }
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      
      if (error.message.includes('HTTP 500')) {
        throw new Error('Server error: The backend encountered an internal error. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', system_initialized: false };
    }
  }

  /**
   * Search for answers and related questions
   */
  async search(query, options = {}) {
    const {
      n_results = 3,
      namespace = '',
      subject = 'all',
      selected_class,
      answer_length = 'normal',
      mcq_threshold,
      mcq_limit,
      answer_settings
    } = options;

    try {
      const response = await this.request('/search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          n_results,
          namespace,
          subject,
          ...(selected_class ? { selected_class } : {}),
          ...(answer_length ? { answer_length } : {}),
          ...(mcq_threshold !== undefined ? { mcq_threshold } : {}),
          ...(mcq_limit !== undefined ? { mcq_limit } : {}),
          ...(answer_settings ? { answer_settings } : {})
        }),
      });

      return response;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Get total questions count
   */
  async getTotalQuestions() {
    try {
      return await this.request('/total-questions');
    } catch (error) {
      console.error('Failed to get total questions:', error);
      return { total_questions: 0, error: error.message };
    }
  }

  /**
   * Get active search and answer-generation settings
   */
  async getSearchSettings() {
    try {
      return await this.request('/search-settings');
    } catch (error) {
      console.error('Failed to get search settings:', error);
      return {
        search: { n_results: 5, mcq_threshold: 0.25, mcq_limit: 0 },
        answer_generation: { temperature: 0.3, top_p: 0.9, max_tokens: 1500 },
        error: error.message
      };
    }
  }

  /**
   * Get system statistics
   */
  async getStats() {
    try {
      return await this.request('/stats');
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { 
        total_questions: 0, 
        total_books: 0, 
        total_users: 0, 
        avg_response_time: 'N/A',
        error: error.message 
      };
    }
  }

  /**
   * Get filter options (unique exam names and subjects) for dropdowns
   */
  async getFilterOptions() {
    try {
      return await this.request('/filters');
    } catch (error) {
      console.error('Failed to get filter options:', error);
      return { 
        exams: [], 
        subjects: [], 
        total_exams: 0,
        total_subjects: 0,
        error: error.message 
      };
    }
  }

  /**
   * Get class filter options for class-specific RAG retrieval
   */
  async getClassOptions() {
    try {
      return await this.request('/class-options');
    } catch (error) {
      console.error('Failed to get class options:', error);
      return {
        classes: [],
        error: error.message
      };
    }
  }

  /**
   * Get questions with filtering
   */
  async getQuestions(options = {}) {
    const { exam = 'all', subject = 'all' } = options;
    
    try {
      const params = new URLSearchParams();
      if (exam !== 'all') params.append('exam', exam);
      if (subject !== 'all') params.append('subject', subject);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return await this.request(`/questions${queryString}`);
    } catch (error) {
      console.error('Failed to get questions:', error);
      return { questions: [], total: 0, error: error.message };
    }
  }

  /**
   * Get inserted books
   */
  async getBooks() {
    try {
      const response = await fetch(`${this.baseUrl}/books`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.books || []
    } catch (error) {
      console.error('Error fetching books:', error)
      throw error
    }
  }

  /**
   * Get inserted PYQs
   */
  async getInsertedPyqs() {
    try {
      const response = await fetch(`${this.baseUrl}/inserted-pyqs`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.inserted_pyqs || []
    } catch (error) {
      console.error('Error fetching inserted PYQs:', error)
      throw error
    }
  }

  /**
   * Get PYQs - alias for getInsertedPyqs for backward compatibility
   */
  async getPyqs() {
    return this.getInsertedPyqs()
  }

  /**
   * Dashboard specific API calls
   */

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      return await this.request('/dashboard/stats');
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return { 
        totalChats: 0,
        totalQuestions: 0,
        totalMcqAttempted: 0,
        mcqCorrect: 0,
        mcqWrong: 0,
        mcqAccuracy: 0,
        error: error.message 
      };
    }
  }

  /**
   * Get subject-wise question statistics
   */
  async getSubjectStats() {
    try {
      return await this.request('/dashboard/subjects');
    } catch (error) {
      console.error('Failed to get subject stats:', error);
      return { 
        subjects: [],
        error: error.message 
      };
    }
  }

  /**
   * Get user achievements
   */
  async getAchievements() {
    try {
      return await this.request('/dashboard/achievements');
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return { 
        achievements: [],
        error: error.message 
      };
    }
  }

  /**
   * Get learning goals and progress
   */
  async getLearningGoals() {
    try {
      return await this.request('/dashboard/goals');
    } catch (error) {
      console.error('Failed to get learning goals:', error);
      return { 
        goals: [],
        error: error.message 
      };
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    try {
      return await this.request('/dashboard/activity');
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return { 
        activities: [],
        error: error.message 
      };
    }
  }

  /**
   * Update user statistics (for tracking user interactions)
   */
  async updateUserStats(statsData) {
    try {
      return await this.request('/dashboard/update-stats', {
        method: 'POST',
        body: JSON.stringify(statsData),
      });
    } catch (error) {
      console.error('Failed to update user stats:', error);
      return { 
        success: false,
        error: error.message 
      };
    }
  }

  /**
   * Track user interaction (chat, mcq attempt, etc.)
   */
  async trackUserInteraction(interaction) {
    try {
      return await this.request('/dashboard/track', {
        method: 'POST',
        body: JSON.stringify(interaction),
      });
    } catch (error) {
      console.error('Failed to track user interaction:', error);
      return { 
        success: false,
        error: error.message 
      };
    }
  }

  /**
   * PYQ Practice specific API calls
   */

  /**
   * Search PYQ questions with filters
   */
  async searchPyqQuestions(options = {}) {
    const {
      query = '',
      exam = null,
      subject = null,
      year = null,
      difficulty = null,
      limit = 10,
      offset = 0
    } = options;

    try {
      const requestBody = {
        query,
        limit,
        offset
      };

      // Add filters if provided
      if (exam) requestBody.exam = exam;
      if (subject) requestBody.subject = subject;
      if (year) requestBody.year = year;
      if (difficulty) requestBody.difficulty = difficulty;

      return await this.request('/pyq/search', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error('Failed to search PYQ questions:', error);
      return { 
        questions: [],
        total: 0,
        error: error.message 
      };
    }
  }

  /**
   * Get available filter options for PYQ practice
   */
  async getPyqFilters() {
    try {
      return await this.request('/pyq/filters');
    } catch (error) {
      console.error('Failed to get PYQ filters:', error);
      return { 
        exams: [],
        subjects: [],
        years: [],
        error: error.message 
      };
    }
  }

  /**
   * Get random PYQ questions for practice
   */
  async getRandomPyqQuestions(options = {}) {
    const {
      count = 10,
      exam = null,
      subject = null,
      year = null,
      difficulty = null
    } = options;

    try {
      const requestBody = {
        count
      };

      // Add filters if provided
      if (exam) requestBody.exam = exam;
      if (subject) requestBody.subject = subject;
      if (year) requestBody.year = year;
      if (difficulty) requestBody.difficulty = difficulty;

      return await this.request('/pyq/random', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error('Failed to get random PYQ questions:', error);
      return { 
        questions: [],
        error: error.message 
      };
    }
  }

  /**
   * Generate AI explanation for a PYQ question
   */
  async generatePyqExplanation(payload = {}) {
    try {
      return await this.request('/pyq/explain', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to generate PYQ explanation:', error);
      return {
        explanation: payload?.existing_explanation || '',
        error: error.message
      };
    }
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService;
