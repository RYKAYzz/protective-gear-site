// API Client for ARK Hygiene Backend
// Base API URL - Automatically detect from current page
// This allows the same code to work on localhost and mobile devices
function getAPIBaseURL() {
  // Get the current host (works for both localhost and IP addresses)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port || (protocol === 'https:' ? '443' : '80');
  
  // If accessing via IP address (mobile), use the IP
  // If accessing via localhost, use localhost
  const baseURL = `${protocol}//${hostname}:3000/api`;
  return baseURL;
}

const API_BASE_URL = getAPIBaseURL();

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessages || data.message || `Validation failed: ${response.status}`);
        }
        // Include status code in error message
        const errorMsg = data.message || data.error || `API request failed: ${response.status} ${response.statusText}`;
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: url
        });
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend server is running.');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }

  // Products API
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async getProductBySlug(slug) {
    return this.request(`/products/slug/${slug}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  async getCategories() {
    return this.request('/products/categories/list');
  }

  // Inquiries API
  async createInquiry(inquiryData) {
    return this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiryData)
    });
  }

  async getInquiries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inquiries?${queryString}`);
  }

  async getInquiry(id) {
    return this.request(`/inquiries/${id}`);
  }

  async updateInquiry(id, inquiryData) {
    return this.request(`/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inquiryData)
    });
  }

  async deleteInquiry(id) {
    return this.request(`/inquiries/${id}`, {
      method: 'DELETE'
    });
  }

  async getInquiryStats() {
    return this.request('/inquiries/stats/summary');
  }

  // Contact API
  async sendContactMessage(contactData) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  }

  // Orders API
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/orders?${queryString}`);
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  async updateOrder(id, orderData) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData)
    });
  }

  async getOrderStats() {
    return this.request('/orders/stats/summary');
  }

  async deleteOrder(id) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE'
    });
  }

  // Auth API
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updatePassword(passwordData) {
    return this.request('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Admin API
  async getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  async getDatabaseStats() {
    return this.request('/admin/database/stats');
  }

  async clearAllData() {
    return this.request('/admin/clear-all-data', {
      method: 'DELETE'
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create singleton instance
const api = new APIClient();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

