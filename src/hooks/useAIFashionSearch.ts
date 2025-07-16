import { useState, useCallback } from 'react';
import { apiService, MessageResponse, GoogleShoppingProduct } from '../services/api';
import toast from 'react-hot-toast';

export interface SearchState {
  isLoading: boolean;
  sessionId: string | null;
  lastResponse: MessageResponse | null;
  products: GoogleShoppingProduct[];
  error: string | null;
}

export interface ProcessedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  brand: string;
  category: string;
  location: string;
  discount?: number;
  productLink: string;
}

export const useAIFashionSearch = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false,
    sessionId: null,
    lastResponse: null,
    products: [],
    error: null,
  });

  // Initialize conversation session
  const initializeSession = useCallback(async () => {
    if (searchState.sessionId) {
      return searchState.sessionId; // Return existing session
    }

    try {
      setSearchState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const conversation = await apiService.createConversation();
      
      setSearchState(prev => ({
        ...prev,
        sessionId: conversation.session_id,
        isLoading: false,
      }));

      return conversation.session_id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize session';
      
      // Create a fallback session ID
      const fallbackSessionId = `fallback_${Date.now()}`;
      
      setSearchState(prev => ({
        ...prev,
        sessionId: fallbackSessionId,
        error: errorMessage,
        isLoading: false,
      }));
      
      // Don't show error toast here - let the calling function handle it
      console.warn('Session initialization failed, using fallback:', errorMessage);
      
      return fallbackSessionId;
    }
  }, [searchState.sessionId]);

  // Process Google Shopping products into our format
  const processProducts = useCallback((products: GoogleShoppingProduct[]): ProcessedProduct[] => {
    return products.map((product, index) => ({
      id: product.product_id || `product_${index}`,
      name: product.title || 'Fashion Item',
      price: product.extracted_price || Math.floor(Math.random() * 3000) + 500,
      originalPrice: product.old_price_extracted > 0 ? product.old_price_extracted : undefined,
      image: product.thumbnail || `https://images.unsplash.com/photo-${1610030469983 + index}?w=400&h=600&fit=crop`,
      rating: 4 + Math.random(),
      reviews: Math.floor(Math.random() * 200) + 50,
      brand: product.source || 'Fashion Brand',
      category: 'Fashion',
      location: 'India',
      discount: product.old_price_extracted > 0 && product.extracted_price > 0 
        ? Math.round((1 - product.extracted_price / product.old_price_extracted) * 100)
        : undefined,
      productLink: product.product_link,
    }));
  }, []);

  // Main search function
  const searchFashion = useCallback(async (query: string): Promise<ProcessedProduct[]> => {
    try {
      setSearchState(prev => ({ ...prev, isLoading: true, error: null }));
      toast.loading('Getting AI fashion suggestions...', { id: 'ai-search' });

      // Step 1: Initialize session if needed
      const sessionId = await initializeSession();

      // Step 2: Send message to get style suggestions
      const messageResponse = await apiService.sendMessage(sessionId, query);
      
      setSearchState(prev => ({
        ...prev,
        lastResponse: messageResponse,
      }));

      toast.success('AI analyzed your request!', { id: 'ai-search' });
      toast.loading('Finding matching products...', { id: 'product-search' });

      // Step 3: Extract shopping queries from style suggestions
      const shoppingQueries: string[] = [];
      
      if (messageResponse.style_suggestion?.items) {
        messageResponse.style_suggestion.items.forEach(item => {
          if (item.shopping_queries) {
            shoppingQueries.push(...item.shopping_queries);
          }
        });
      }

      // Fallback to original query if no specific queries found
      if (shoppingQueries.length === 0) {
        shoppingQueries.push(`${query} fashion clothes India`);
      }

      // Step 4: Search for products using all queries
      const products = await apiService.batchSearchProducts(shoppingQueries);
      
      // Step 5: Process and return products
      const processedProducts = processProducts(products);
      
      setSearchState(prev => ({
        ...prev,
        products,
        isLoading: false,
      }));

      toast.success(`Found ${processedProducts.length} fashion items!`, { id: 'product-search' });
      
      return processedProducts;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      
      setSearchState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      // Always dismiss loading toasts
      toast.dismiss('ai-search');
      toast.dismiss('product-search');
      
      // Show user-friendly error message but don't block the app
      toast.error('AI search temporarily unavailable. Using enhanced search.', { duration: 3000 });
      
      // Return empty array to let the app fall back to mock data
      return [];
    }
  }, [initializeSession, processProducts]);

  // Get follow-up suggestions
  const getFollowUpSuggestions = useCallback((): string[] => {
    return searchState.lastResponse?.follow_up_suggestions || [];
  }, [searchState.lastResponse]);

  // Get style suggestion details
  const getStyleSuggestion = useCallback(() => {
    return searchState.lastResponse?.style_suggestion || null;
  }, [searchState.lastResponse]);

  // Reset search state
  const resetSearch = useCallback(() => {
    setSearchState({
      isLoading: false,
      sessionId: null,
      lastResponse: null,
      products: [],
      error: null,
    });
  }, []);

  return {
    searchState,
    searchFashion,
    getFollowUpSuggestions,
    getStyleSuggestion,
    resetSearch,
    initializeSession,
  };
};