import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star, Settings, Fuel, Calendar, Heart } from 'lucide-react';
import { useState } from 'react';
import type { Motorcycle } from '../App';

interface MotorcycleCardProps {
  motorcycle: Motorcycle;
  onDetails: () => void;
  onReserve: () => void;
}

export function MotorcycleCard({ motorcycle, onDetails, onReserve }: MotorcycleCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

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
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>
      </div>
      
      {/* Content Section with Grid Alignment */}
      <CardContent className="p-sm flex flex-col h-full">
        {/* Motorcycle Name - Montserrat Bold */}
        <h3 className="text-heading text-lg line-clamp-1 mb-2">
          {motorcycle.name}
        </h3>
        
        {/* Rating and Reviews - Horizontally Aligned */}
        <div className="flex items-center mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
          <span className="text-sm mr-2 text-label">{motorcycle.rating}</span>
          <span className="text-sm text-muted-foreground font-body">({motorcycle.reviewCount} reviews)</span>
        </div>
        
        {/* Details Row - All Baseline Aligned */}
        <div className="flex items-baseline justify-between text-sm text-muted-foreground mb-3 gap-xs font-body">
          <div className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            <span className="text-label">{motorcycle.engineCapacity}cc</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="w-4 h-4" />
            <span className="text-label">{motorcycle.transmission}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="text-label">{motorcycle.year}</span>
          </div>
        </div>
        
        {/* Price Row - Bold, Left Aligned */}
        <div className="mb-3">
          <span className="text-price text-2xl">
            ₱{motorcycle.pricePerDay}
          </span>
          <span className="text-sm text-muted-foreground font-body">/day</span>
        </div>
        
        {/* Description - Exactly 2 Lines Max */}
        <p className="text-sm text-muted-foreground leading-5 line-clamp-2 flex-1 mb-4 font-body">
          {motorcycle.description}
        </p>
      </CardContent>
      
      {/* Buttons Section - Same Height, Side by Side */}
      <CardFooter className="p-sm pt-0 mt-auto">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1 h-10 text-label btn-hover border-border hover:bg-muted hover:border-primary"
            onClick={onDetails}
            disabled={motorcycle.availability !== 'Available'}
          >
            Details
          </Button>
          <Button 
            className="flex-1 h-10 bg-primary hover:bg-primary-dark text-label btn-hover text-[rgba(255,255,255,1)]"
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