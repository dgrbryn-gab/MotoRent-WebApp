import { useState, useEffect } from 'react';
import { Heart, Bike, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import type { Motorcycle } from '../App';

interface FavoritesPageProps {
  onNavigate?: (page: string, motorcycleId?: string) => void;
}

export function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<Motorcycle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
    
    // Listen for storage changes from other components
    const handleStorageChange = () => {
      loadFavorites();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadFavorites = () => {
    try {
      setLoading(true);
      const savedFavorites = localStorage.getItem('favoritedMotorcycles');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (motorcycleId: string) => {
    try {
      const updated = favorites.filter(m => m.id !== motorcycleId);
      setFavorites(updated);
      localStorage.setItem('favoritedMotorcycles', JSON.stringify(updated));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  const filteredFavorites = favorites.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-primary mb-2">My Favorite Motorcycles</h1>
        <p className="text-muted-foreground">Browse your saved motorcycles and book them anytime</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Favorites Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Bike className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((motorcycle) => (
            <Card key={motorcycle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden bg-muted">
                <ImageWithFallback
                  src={motorcycle.image}
                  alt={motorcycle.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => removeFavorite(motorcycle.id)}
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">{motorcycle.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{motorcycle.type}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Engine</span>
                    <span className="text-sm font-medium">{motorcycle.engineCapacity}cc</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price/Day</span>
                    <span className="text-sm font-semibold text-primary">₱{motorcycle.pricePerDay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Availability</span>
                    <Badge variant={
                      motorcycle.availability === 'Available' ? 'default' :
                      motorcycle.availability === 'Reserved' ? 'secondary' : 'destructive'
                    }>
                      {motorcycle.availability}
                    </Badge>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => onNavigate?.('details', motorcycle.id)}
                >
                  View & Book
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No matching favorites' : 'No Favorites Yet'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try searching with different keywords'
                : 'Start adding motorcycles to your favorites to see them here'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
