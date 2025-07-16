import { useState, useEffect } from 'react'
import { Search, Mic, Heart, ShoppingBag, User, Filter, Star, MapPin, Sparkles, ExternalLink } from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { blink } from './blink/client'
import { useAIFashionSearch, ProcessedProduct } from './hooks/useAIFashionSearch'
import toast, { Toaster } from 'react-hot-toast'

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  brand: string
  category: string
  location: string
  discount?: number
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Elegant Red Silk Saree',
    price: 2499,
    originalPrice: 3999,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop',
    rating: 4.5,
    reviews: 234,
    brand: 'Fabindia',
    category: 'Sarees',
    location: 'Mumbai',
    discount: 38
  },
  {
    id: '2',
    name: 'Cotton Kurta Set for Office',
    price: 1299,
    originalPrice: 1899,
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=600&fit=crop',
    rating: 4.2,
    reviews: 156,
    brand: 'W for Woman',
    category: 'Kurtas',
    location: 'Delhi',
    discount: 32
  },
  {
    id: '3',
    name: 'Designer Lehenga Choli',
    price: 8999,
    originalPrice: 12999,
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=600&fit=crop',
    rating: 4.8,
    reviews: 89,
    brand: 'Kalki Fashion',
    category: 'Lehengas',
    location: 'Jaipur',
    discount: 31
  },
  {
    id: '4',
    name: 'Casual Denim Jacket',
    price: 1799,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop',
    rating: 4.1,
    reviews: 203,
    brand: 'Zara',
    category: 'Jackets',
    location: 'Bangalore'
  },
  {
    id: '5',
    name: 'Traditional Bandhani Dupatta',
    price: 899,
    originalPrice: 1299,
    image: 'https://images.unsplash.com/photo-1583391733981-3cc22c4e0e3c?w=400&h=600&fit=crop',
    rating: 4.3,
    reviews: 167,
    brand: 'Biba',
    category: 'Dupattas',
    location: 'Ahmedabad',
    discount: 31
  },
  {
    id: '6',
    name: 'Formal Blazer for Women',
    price: 2299,
    originalPrice: 3199,
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=600&fit=crop',
    rating: 4.4,
    reviews: 124,
    brand: 'AND',
    category: 'Blazers',
    location: 'Chennai',
    discount: 28
  }
]

const categories = [
  { name: 'Sarees', icon: '🥻', color: 'bg-pink-100 text-pink-700' },
  { name: 'Kurtas', icon: '👘', color: 'bg-purple-100 text-purple-700' },
  { name: 'Lehengas', icon: '👗', color: 'bg-red-100 text-red-700' },
  { name: 'Jackets', icon: '🧥', color: 'bg-blue-100 text-blue-700' },
  { name: 'Dupattas', icon: '🧣', color: 'bg-green-100 text-green-700' },
  { name: 'Blazers', icon: '👔', color: 'bg-yellow-100 text-yellow-700' }
]

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<(Product | ProcessedProduct)[]>(mockProducts)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [user, setUser] = useState({ id: 'guest_user', email: 'guest@example.com' })
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([])
  
  // Use the AI Fashion Search hook
  const { 
    searchState, 
    searchFashion, 
    getFollowUpSuggestions, 
    getStyleSuggestion,
    initializeSession 
  } = useAIFashionSearch()

  // Authentication is disabled - using guest mode

  // Initialize session when search bar is clicked
  const handleSearchBarClick = async () => {
    try {
      await initializeSession()
    } catch (error) {
      console.error('Failed to initialize session:', error)
      // Session initialization now has fallback, so this won't throw
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      // Use the AI Fashion Search hook
      const aiProducts = await searchFashion(searchQuery)
      
      if (aiProducts.length > 0) {
        setProducts(aiProducts)
        setFollowUpSuggestions(getFollowUpSuggestions())
      } else {
        // Fallback to enhanced mock search
        const filteredProducts = mockProducts.filter(product => {
          const query = searchQuery.toLowerCase()
          return product.name.toLowerCase().includes(query) ||
                 product.category.toLowerCase().includes(query) ||
                 product.brand.toLowerCase().includes(query) ||
                 // Add semantic matching for Indian fashion terms
                 (query.includes('शादी') || query.includes('wedding')) && product.category === 'Lehengas' ||
                 (query.includes('office') || query.includes('formal')) && (product.category === 'Kurtas' || product.category === 'Blazers') ||
                 (query.includes('casual')) && (product.category === 'Jackets' || product.category === 'Kurtas')
        })
        
        setProducts(filteredProducts.length > 0 ? filteredProducts : mockProducts)
        toast.success(`Found ${filteredProducts.length || mockProducts.length} items (fallback mode)`)
      }
      
    } catch (error) {
      console.error('AI Search error:', error)
      // Final fallback to simple mock search
      const filteredProducts = mockProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setProducts(filteredProducts)
      toast.success(`Found ${filteredProducts.length} items (offline mode)`)
    }
  }

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice search not supported in this browser')
      return
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      toast.loading('Listening... Speak now!', { id: 'voice' })
    }

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      setSearchQuery(transcript)
      toast.success(`Heard: "${transcript}"`, { id: 'voice' })
      
      // Initialize session and auto-search after voice input
      try {
        await initializeSession()
        setTimeout(() => {
          handleSearch()
        }, 500)
      } catch (error) {
        console.error('Failed to initialize session after voice input:', error)
        // Session initialization now has fallback, still proceed with search
        setTimeout(() => {
          handleSearch()
        }, 500)
      }
    }

    recognition.onerror = () => {
      toast.error('Voice search failed. Please try again.', { id: 'voice' })
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId)
      toast.success('Removed from favorites')
    } else {
      newFavorites.add(productId)
      toast.success('Added to favorites')
    }
    setFavorites(newFavorites)
  }

  const filterByCategory = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null)
      setProducts(mockProducts)
    } else {
      setSelectedCategory(category)
      const filtered = mockProducts.filter(product => product.category === category)
      setProducts(filtered)
    }
  }



  // Authentication is disabled - proceed directly to main app

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">AI Fashion</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-4">
        <div className="relative mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search: 'लाल साड़ी शादी के लिए' or 'casual kurta office'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onClick={handleSearchBarClick}
                className="pl-10 pr-4 py-3 text-base"
              />
              {searchState.sessionId && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
              )}
            </div>
            <Button
              onClick={handleSearch}
              variant="default"
              size="icon"
              className="shrink-0 h-12 w-12"
              disabled={searchState.isLoading}
            >
              <Search className={`h-5 w-5 ${searchState.isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={handleVoiceSearch}
              variant={isListening ? "default" : "outline"}
              size="icon"
              className="shrink-0 h-12 w-12"
            >
              <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>

        {/* AI Style Suggestions */}
        {getStyleSuggestion() && (
          <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-primary">AI Style Suggestion</h3>
            </div>
            <h4 className="font-semibold mb-1">{getStyleSuggestion()?.title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{getStyleSuggestion()?.description}</p>
            
            {getStyleSuggestion()?.items && (
              <div className="space-y-2">
                {getStyleSuggestion()!.items.map((item, index) => (
                  <div key={index} className="text-xs bg-background/50 p-2 rounded">
                    <span className="font-medium">{item.type}</span> - {item.color} {item.material} in {item.fit} fit, {item.style} style
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Follow-up Suggestions */}
        {followUpSuggestions.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Try these suggestions:</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {followUpSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(suggestion)
                    handleSearch()
                  }}
                  className="shrink-0 text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => filterByCategory(category.name)}
                className="shrink-0 gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {products.length} items found
          </p>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4 pb-20">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {product.discount && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{product.discount}%
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorites.has(product.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-600'
                    }`}
                  />
                </Button>
                {/* External link for AI-found products */}
                {'productLink' in product && product.productLink && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => window.open(product.productLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                  </Button>
                )}
              </div>
              <CardContent className="p-3">
                <div className="mb-2">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                    {'productLink' in product && product.productLink && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-2 w-2 mr-1" />
                        AI Found
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{product.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                  {'productLink' in product && product.productLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => window.open(product.productLink, '_blank')}
                    >
                      View
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <Search className="h-5 w-5" />
              <span className="text-xs">Search</span>
            </Button>
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <Heart className="h-5 w-5" />
              <span className="text-xs">Favorites</span>
            </Button>
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-xs">Cart</span>
            </Button>
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default App