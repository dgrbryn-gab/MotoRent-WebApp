import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { MotorcycleCard } from './MotorcycleCard';
import { motorcycleService } from '../services/motorcycleService';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import type { Motorcycle } from '../App';

interface HomePageProps {
  selectMotorcycle: (motorcycle: Motorcycle) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

const motorcycleCategories = ['All', 'Yamaha', 'Honda', 'Suzuki'];

export function HomePage({ selectMotorcycle, searchTerm: externalSearchTerm, onSearchChange }: HomePageProps) {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = onSearchChange || setInternalSearchTerm;

  // Load motorcycles from Supabase on mount
  useEffect(() => {
    const loadMotorcycles = async () => {
      try {
        setLoading(true);
        const data = await motorcycleService.getAllMotorcycles();
        setMotorcycles(data);
      } catch (error) {
        console.error('Failed to load motorcycles:', error);
        toast.error('Failed to load motorcycles. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadMotorcycles();
  }, []);

  // Helper function to extract brand from motorcycle name
  const getBrand = (name: string) => {
    return name.split(' ')[0]; // Returns first word (Yamaha, Honda, Suzuki)
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return motorcycles.length;
    return motorcycles.filter(m => getBrand(m.name) === category).length;
  };

  const filteredMotorcycles = motorcycles
    .filter((motorcycle: Motorcycle) => {
      const brand = getBrand(motorcycle.name);
      const searchLower = searchTerm.toLowerCase();
      
      // Comprehensive search across multiple fields
      const matchesSearch = searchTerm === '' || 
        motorcycle.name.toLowerCase().includes(searchLower) ||
        brand.toLowerCase().includes(searchLower) ||
        motorcycle.type.toLowerCase().includes(searchLower) ||
        motorcycle.transmission.toLowerCase().includes(searchLower) ||
        motorcycle.color.toLowerCase().includes(searchLower) ||
        motorcycle.description.toLowerCase().includes(searchLower) ||
        motorcycle.features.some((feature: string) => feature.toLowerCase().includes(searchLower)) ||
        motorcycle.engineCapacity.toString().includes(searchLower) ||
        motorcycle.year.toString().includes(searchLower);
        
      const matchesCategory = selectedCategory === 'All' || brand === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  return (
    <div className="bg-background min-h-screen">
      <div className="container-custom p-lg">
        {/* Header Section */}
        <div className="p-lg">
          <h1 className="text-heading text-4xl mb-4">
            Available Motorcycles
          </h1>
          <p className="font-body text-muted-foreground text-lg">Choose from our fleet of well-maintained motorcycles in Dumaguete</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading motorcycles...</p>
            </div>
          </div>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && (
          <>
            {/* Category Tabs - Brand Based Categories */}
            <div className="mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-card border border-border">
              {motorcycleCategories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="flex items-center gap-2 text-label data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted transition-all duration-200"
                >
                  {category}
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                    {getCategoryCount(category)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Motorcycle Grid - Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredMotorcycles.map((motorcycle) => (
            <MotorcycleCard
              key={motorcycle.id}
              motorcycle={motorcycle}
              onDetails={() => selectMotorcycle(motorcycle)}
              onReserve={() => selectMotorcycle(motorcycle)}
            />
          ))}
        </div>

        {/* No Results State */}
        {filteredMotorcycles.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h3 className="text-heading text-lg mb-2">
                No motorcycles found
              </h3>
              <p className="font-body text-muted-foreground mb-6">
                No motorcycles match your current search and filter criteria.
              </p>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}