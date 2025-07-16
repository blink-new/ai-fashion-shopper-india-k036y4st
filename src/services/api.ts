// API service for fashion search endpoints
export interface ConversationResponse {
  session_id: string;
  message: string;
  timestamp: string;
}

export interface StyleSuggestion {
  title: string;
  description: string;
  items: Array<{
    type: string;
    color: string;
    material: string;
    fit: string;
    style: string;
    shopping_queries: string[];
  }>;
}

export interface MessageResponse {
  message: string;
  request_type: string;
  style_suggestion: StyleSuggestion;
  follow_up_suggestions: string[];
  filters: {
    price: {
      min: number;
      max: number;
    };
  };
  model_info: {
    provider: string;
    model_name: string;
  };
  timestamp: string;
  session_id: string;
}

export interface GoogleShoppingProduct {
  title: string;
  product_link: string;
  product_id: string;
  scrapingdog_product_link: string;
  scrapingdog_immersive_product_link: string;
  source: string;
  price: string;
  extracted_price: number;
  old_price_extracted: number;
  extensions: string[];
  thumbnail: string;
  position: number;
}

export interface GoogleShoppingResponse {
  shopping_results: GoogleShoppingProduct[];
}

// Base API configuration
const API_BASE_URL = 'https://agent-service-2wpf.onrender.com';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Create a new conversation session
  async createConversation(): Promise<ConversationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to create conversation: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Re-throw with more context
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to connect to AI service. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Send message to get style suggestions
  async sendMessage(sessionId: string, content: string): Promise<MessageResponse> {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('role', 'user');

      const response = await fetch(`${this.baseUrl}/api/v1/messages`, {
        method: 'POST',
        body: formData,
        headers: {
          'Session-ID': sessionId,
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to send message to AI service. Please try again.');
      }
      throw error;
    }
  }

  // Search Google Shopping for products
  async searchGoogleShopping(
    query: string,
    options: {
      country?: string;
      language?: string;
      location?: string;
      google_domain?: string;
      gl?: string;
      hl?: string;
      direct_link?: boolean;
    } = {}
  ): Promise<GoogleShoppingResponse> {
    try {
      const params = new URLSearchParams({
        query,
        ...Object.fromEntries(
          Object.entries(options).filter(([_, value]) => value !== undefined)
        ),
      });

      const response = await fetch(
        `${this.baseUrl}/api/v1/scraping/google_shopping?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to search Google Shopping: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching Google Shopping:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to search products. Please check your connection.');
      }
      throw error;
    }
  }

  // Batch search multiple queries for complete outfit
  async batchSearchProducts(queries: string[]): Promise<GoogleShoppingProduct[]> {
    try {
      const searchPromises = queries.map(query =>
        this.searchGoogleShopping(query, {
          country: 'IN',
          language: 'en',
          location: 'India',
          hl: 'en',
          gl: 'in'
        })
      );

      const results = await Promise.allSettled(searchPromises);
      
      const allProducts: GoogleShoppingProduct[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allProducts.push(...result.value.shopping_results);
        } else {
          console.warn(`Search failed for query "${queries[index]}":`, result.reason);
        }
      });

      return allProducts;
    } catch (error) {
      console.error('Error in batch search:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();