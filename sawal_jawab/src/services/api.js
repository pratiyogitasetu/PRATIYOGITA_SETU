const getApiBaseUrl = () => {
  if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL must be set in production.');
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  return `${import.meta.env.VITE_API_BASE_URL}/api`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

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
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      return { status: 'error', system_initialized: false };
    }
  }

  async getTotalQuestions() {
    try {
      return await this.request('/total-questions');
    } catch (error) {
      return { total_questions: 0 };
    }
  }

  async searchPyqQuestions(options = {}) {
    const {
      query = '',
      exam = null,
      subject = null,
      year = null,
      limit = 10
    } = options;

    try {
      const requestBody = { query, limit };
      if (exam) requestBody.exam = exam;
      if (subject) requestBody.subject = subject;
      if (year) requestBody.year = year;

      return await this.request('/pyq/search', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error('Failed to search PYQ questions:', error);
      return { questions: [], total: 0 };
    }
  }

  async getPyqFilters() {
    try {
      return await this.request('/pyq/filters');
    } catch (error) {
      return { exams: [], subjects: [], years: [] };
    }
  }

  async getRandomPyqQuestions(options = {}) {
    const { count = 10, exam = null, subject = null, year = null } = options;
    try {
      const requestBody = { count };
      if (exam) requestBody.exam = exam;
      if (subject) requestBody.subject = subject;
      if (year) requestBody.year = year;

      return await this.request('/pyq/random', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      return { questions: [] };
    }
  }

  async generatePyqExplanation(payload = {}) {
    try {
      return await this.request('/pyq/explain', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      return { explanation: payload?.existing_explanation || '' };
    }
  }

  async getDashboardStats() {
    try {
      return await this.request('/dashboard/stats');
    } catch (error) {
      return null;
    }
  }

  async getSubjectStats() {
    try {
      return await this.request('/dashboard/subjects');
    } catch (error) {
      return { subjects: [] };
    }
  }

  async trackUserInteraction(interaction) {
    try {
      return await this.request('/dashboard/track', {
        method: 'POST',
        body: JSON.stringify(interaction),
      });
    } catch (error) {
      return { success: false };
    }
  }

  async updateUserStats(statsData) {
    try {
      return await this.request('/dashboard/update-stats', {
        method: 'POST',
        body: JSON.stringify(statsData),
      });
    } catch (error) {
      return { success: false };
    }
  }
}

const apiService = new ApiService();
export default apiService;
