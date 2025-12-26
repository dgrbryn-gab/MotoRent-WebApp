import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star, Settings, Fuel, Calendar, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Motorcycle } from '../App';

interface MotorcycleCardProps {
  motorcycle: Motorcycle;
  onDetails: () => void;
  onReserve: () => void;
}

export function MotorcycleCard({ motorcycle, onDetails, onReserve }: MotorcycleCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  // Check if motorcycle is already in favorites on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoritedMotorcycles');
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites);
      setIsFavorited(favorites.some((m: Motorcycle) => m.id === motorcycle.id));
    }
  }, [motorcycle.id]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const savedFavorites = localStorage.getItem('favoritedMotorcycles');
      let favorites: Motorcycle[] = savedFavorites ? JSON.parse(savedFavorites) : [];
      
      if (isFavorited) {
        // Remove from favorites
        favorites = favorites.filter(m => m.id !== motorcycle.id);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        if (!favorites.some(m => m.id === motorcycle.id)) {
          favorites.push(motorcycle);
        }
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
      
      localStorage.setItem('favoritedMotorcycles', JSON.stringify(favorites));
      // Trigger storage event for other tabs/windows
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const getAvailabilityBadge = () => {
    const variants = {
      'Available': 'bg-success text-success-foreground',
      'Reserved': 'bg-warning text-warning-foreground',
      'In Maintenance': 'bg-error text-error-foreground'
    };
    
    return (
      <Badge className={`${variants[motorcycle.availability]} text-xs font-semibold`}>
        {motorcycle.availability}
      </Badge>
    );
  };

  return (
    <Card className="w-full overflow-hidden card-hover bg-card border-border" style={{ borderRadius: 'var(--card-border-radius)' }}>
      {/* Image Section with Badges and Favorite */}
      <div className="relative overflow-hidden" style={{ height: 'var(--card-image-height)' }}>
        <ImageWithFallback
          src={motorcycle.image}
          alt={motorcycle.name}
          className="w-full h-full object-cover card-image"
        />
        
        {/* Type Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1">
            {motorcycle.type}
          </Badge>
        </div>
        
        {/* Availability Badge - Top Right */}
        <div className="absolute top-3 right-12">
          {getAvailabilityBadge()}
        </div>
        
        {/* Favorite Heart - Top Right Corner */}
        <button
          onClick={handleFavoriteToggle}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited 
                ? 'fill-red-500 text-red-500' 
                : 'text-muted-foreground hover:text-red-500'
            }`}
          />
        </button>
      </div>
      
      {/* Content Section with Grid Alignment */}
      <CardContent className="p-2 flex flex-col h-full">
        {/* Motorcycle Name - Montserrat Bold */}
        <h3 className="text-heading text-lg line-clamp-1 mb-0.5">
          {motorcycle.name}
        </h3>
        
        {/* Rating and Reviews - Horizontally Aligned */}
        <div className="flex items-center mb-1.5">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-0.5" />
          <span className="text-sm mr-1 text-label">{motorcycle.rating}</span>
          <span className="text-xs text-muted-foreground font-body">({motorcycle.reviewCount})</span>
        </div>
        
        {/* Details Row - All Baseline Aligned */}
        <div className="flex items-baseline justify-between text-sm text-muted-foreground mb-1.5 gap-2 font-body px-2 py-1.5 bg-muted/30 rounded">
          <div className="flex items-center gap-0.5">
            <Settings className="w-3 h-3" />
            <span className="text-label text-sm">{motorcycle.engineCapacity}cc</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Fuel className="w-3 h-3" />
            <span className="text-label text-sm">{motorcycle.transmission}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Calendar className="w-3 h-3" />
            <span className="text-label text-sm">{motorcycle.year}</span>
          </div>
        </div>
        
        {/* Price Row - Bold, Left Aligned */}
        <div className="mb-1">
          <span className="text-price text-2xl">
            ₱{motorcycle.pricePerDay}
          </span>
          <span className="text-sm text-muted-foreground font-body">/day</span>
        </div>
        
        {/* Description - Exactly 1 Line Max */}
        <p className="text-sm text-muted-foreground leading-4 line-clamp-1 flex-1 font-body">
          {motorcycle.description}
        </p>
      </CardContent>
      
      {/* Buttons Section - Same Height, Side by Side */}
      <CardFooter className="p-2 pt-1">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1 h-9 text-sm font-medium btn-hover border-border hover:bg-muted hover:border-primary"
            onClick={onDetails}
            disabled={motorcycle.availability !== 'Available'}
          >
            Details
          </Button>
          <Button 
            className="flex-1 h-9 text-sm font-medium bg-primary hover:bg-primary-dark btn-hover text-[rgba(255,255,255,1)]"
            onClick={onReserve}
            disabled={motorcycle.availability !== 'Available'}
          >
            Reserve
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}