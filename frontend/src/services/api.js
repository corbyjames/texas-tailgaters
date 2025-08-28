const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Image endpoints
  async uploadImage(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== null && metadata[key] !== undefined) {
        formData.append(key, metadata[key]);
      }
    });

    return this.request('/api/v1/images/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async listImages(limit = 20, offset = 0) {
    return this.request(`/api/v1/images?limit=${limit}&offset=${offset}`);
  }

  async getImage(imageId) {
    return this.request(`/api/v1/images/${imageId}`);
  }

  async deleteImage(imageId) {
    return this.request(`/api/v1/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  // Species endpoints
  async listSpecies(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/v1/species?${params}`);
  }

  async searchSpecies(query) {
    return this.request(`/api/v1/species/search?q=${encodeURIComponent(query)}`);
  }

  async getSpecies(scientificName) {
    return this.request(`/api/v1/species/${encodeURIComponent(scientificName)}`);
  }

  async getTaxonomyTree() {
    return this.request('/api/v1/species/taxonomy/tree');
  }

  // Identification endpoints
  async identifySpecies(file, location = {}, saveImage = true) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (location.lat) formData.append('lat', location.lat);
    if (location.lon) formData.append('lon', location.lon);
    formData.append('save_image', saveImage);

    return this.request('/api/v1/identify', {
      method: 'POST',
      body: formData,
    });
  }

  async getRecentIdentifications(limit = 10) {
    return this.request(`/api/v1/identify/recent?limit=${limit}`);
  }

  async getIdentificationStats() {
    return this.request('/api/v1/identify/stats');
  }

  // Search endpoints
  async search(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/api/v1/search?${params}`);
  }

  // Feedback endpoints
  async submitFeedback(feedbackData) {
    return this.request('/api/v1/feedback/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });
  }

  async retryIdentification(observationId, feedback = null, excludeSpecies = []) {
    return this.request('/api/v1/feedback/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        observation_id: observationId,
        feedback: feedback,
        exclude_species: excludeSpecies,
      }),
    });
  }

  async getFeedbackStats() {
    return this.request('/api/v1/feedback/stats');
  }
}

export default new ApiService();