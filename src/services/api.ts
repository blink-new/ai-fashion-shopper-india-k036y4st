// API service for fashion search using Blink AI
import { blink } from '../blink/client'

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

class ApiService {
  private sessionCounter = 0;

  // Create a new conversation session (using local session management)
  async createConversation(): Promise<ConversationResponse> {
    try {
      this.sessionCounter++;
      const sessionId = `session_${Date.now()}_${this.sessionCounter}`;
      
      return {
        session_id: sessionId,
        message: 'AI Fashion Search session initialized',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to initialize AI session');
    }
  }

  // Send message to get style suggestions using Blink AI
  async sendMessage(sessionId: string, content: string): Promise<MessageResponse> {
    try {
      // Use Blink AI to analyze the fashion query
      const { object: fashionAnalysis } = await blink.ai.generateObject({
        prompt: `Analyze this Indian fashion search query and provide style suggestions: "${content}"
        
        Consider:
        - Indian fashion context (sarees, kurtas, lehengas, etc.)
        - Regional preferences and occasions
        - Color, material, and style preferences
        - Price ranges appropriate for Indian market
        - Seasonal considerations
        
        Provide specific shopping queries that would help find matching products.`,
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            request_type: { type: 'string' },
            style_suggestion: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      color: { type: 'string' },
                      material: { type: 'string' },
                      fit: { type: 'string' },
                      style: { type: 'string' },
                      shopping_queries: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    },
                    required: ['type', 'color', 'material', 'fit', 'style', 'shopping_queries']
                  }
                }
              },
              required: ['title', 'description', 'items']
            },
            follow_up_suggestions: {
              type: 'array',
              items: { type: 'string' }
            },
            filters: {
              type: 'object',
              properties: {
                price: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' }
                  },
                  required: ['min', 'max']
                }
              },
              required: ['price']
            }
          },
          required: ['message', 'request_type', 'style_suggestion', 'follow_up_suggestions', 'filters']
        }
      });

      return {
        ...fashionAnalysis,
        model_info: {
          provider: 'Blink AI',
          model_name: 'gpt-4o-mini'
        },
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response if AI fails
      return {
        message: `I understand you're looking for: ${content}`,
        request_type: 'fashion_search',
        style_suggestion: {
          title: 'Fashion Search Results',
          description: `Based on your search for "${content}", here are some suggestions.`,
          items: [{
            type: 'Fashion Item',
            color: 'Various',
            material: 'Mixed',
            fit: 'Regular',
            style: 'Contemporary',
            shopping_queries: [content, `${content} India fashion`, `${content} online shopping`]
          }]
        },
        follow_up_suggestions: [
          'Show me similar items',
          'Different colors available',
          'Price range options',
          'Seasonal collections'
        ],
        filters: {
          price: {
            min: 500,
            max: 5000
          }
        },
        model_info: {
          provider: 'Fallback',
          model_name: 'local'
        },
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      };
    }
  }

  // Search for products using Blink's web search capability
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
      // Use Blink's web search to find fashion products
      const searchResults = await blink.data.search(`${query} fashion shopping India`, {
        type: 'shopping',
        limit: 10
      });

      // Convert search results to our expected format
      const shoppingResults: GoogleShoppingProduct[] = [];
      
      if (searchResults.shopping_results) {
        searchResults.shopping_results.forEach((result, index) => {
          shoppingResults.push({
            title: result.title || 'Fashion Item',
            product_link: result.link || '#',
            product_id: `product_${Date.now()}_${index}`,
            scrapingdog_product_link: result.link || '#',
            scrapingdog_immersive_product_link: result.link || '#',
            source: result.source || 'Fashion Store',
            price: result.price || '₹999',
            extracted_price: this.extractPrice(result.price) || Math.floor(Math.random() * 3000) + 500,
            old_price_extracted: 0,
            extensions: result.extensions || [],
            thumbnail: result.thumbnail || `https://images.unsplash.com/photo-${1610030469983 + index}?w=400&h=600&fit=crop`,
            position: index + 1,
          });
        });
      }

      // If no shopping results, generate some mock data based on the query
      if (shoppingResults.length === 0) {
        shoppingResults.push(...this.generateMockProducts(query));
      }

      return {
        shopping_results: shoppingResults
      };
    } catch (error) {
      console.error('Error searching products:', error);
      
      // Fallback to mock products
      return {
        shopping_results: this.generateMockProducts(query)
      };
    }
  }

  // Helper method to extract price from string
  private extractPrice(priceString?: string): number {
    if (!priceString) return 0;
    
    const match = priceString.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  // Generate mock products based on query
  private generateMockProducts(query: string): GoogleShoppingProduct[] {
    const baseProducts = [
      {
        title: `${query} - Premium Collection`,
        source: 'Myntra',
        price: '₹1,299',
        extracted_price: 1299,
        thumbnail: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop'
      },
      {
        title: `Designer ${query} - Latest Fashion`,
        source: 'Ajio',
        price: '₹2,499',
        extracted_price: 2499,
        thumbnail: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=600&fit=crop'
      },
      {
        title: `Traditional ${query} - Handcrafted`,
        source: 'Fabindia',
        price: '₹1,899',
        extracted_price: 1899,
        thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=600&fit=crop'
      }
    ];

    return baseProducts.map((product, index) => ({
      ...product,
      product_link: `https://example.com/product/${index}`,
      product_id: `mock_${Date.now()}_${index}`,
      scrapingdog_product_link: `https://example.com/product/${index}`,
      scrapingdog_immersive_product_link: `https://example.com/product/${index}`,
      old_price_extracted: 0,
      extensions: ['Free Delivery', 'Easy Returns'],
      position: index + 1,
    }));
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