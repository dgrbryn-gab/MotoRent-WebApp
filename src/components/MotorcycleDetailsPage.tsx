import { useState } from 'react';
import { ArrowLeft, CheckCircle, Calendar, Star, Settings, Fuel, Palette, Gauge, Zap, User as UserIcon, LogIn, Shield, Clock, MapPin, PhoneCall, FileText, AlertCircle, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Page, Motorcycle, User } from '../App';

interface MotorcycleDetailsPageProps {
  motorcycle: Motorcycle;
  navigate: (page: Page) => void;
  user: User | null;
  isGuest: boolean;
  initiateReservation: (motorcycle: Motorcycle) => void;
}

export function MotorcycleDetailsPage({ motorcycle, navigate, user, isGuest, initiateReservation }: MotorcycleDetailsPageProps) {
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(() => {
    const savedFavorites = localStorage.getItem('favoritedMotorcycles');
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites);
      return favorites.some((m: Motorcycle) => m.id === motorcycle.id);
    }
    return false;
  });

  const toggleFavorite = () => {
    try {
      const savedFavorites = localStorage.getItem('favoritedMotorcycles');
      let favorites: Motorcycle[] = savedFavorites ? JSON.parse(savedFavorites) : [];

      if (isFavorited) {
        favorites = favorites.filter(m => m.id !== motorcycle.id);
      } else {
        favorites.push(motorcycle);
      }

      localStorage.setItem('favoritedMotorcycles', JSON.stringify(favorites));
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleReserve = () => {
    if (isGuest) {
      // Set up the reservation context and show modal
      initiateReservation(motorcycle);
      setShowGuestModal(true);
    } else {
      navigate('booking');
    }
  };

  const handleLogin = () => {
    setShowGuestModal(false);
    navigate('login');
  };

  const handleSignUp = () => {
    setShowGuestModal(false);
    navigate('signup');
  };

  const getAvailabilityBadge = () => {
    const variants = {
      'Available': 'bg-success text-success-foreground',
      'Reserved': 'bg-warning text-warning-foreground',
      'In Maintenance': 'bg-error text-error-foreground'
    };
    
    return (
      <Badge className={variants[motorcycle.availability]}>
        {motorcycle.availability}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-secondary border-b border-border">
        <div className="container-custom py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('home')}
            className="mb-4 btn-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Motorcycles
          </Button>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Motorcycle Details
          </h1>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid-12 gap-8">
          {/* Image Section - 5 columns */}
          <div className="col-span-5 mobile:col-span-4">
            <Card className="card-hover overflow-hidden sticky top-20">
              <div className="aspect-square relative">
                <ImageWithFallback
                  src={motorcycle.image}
                  alt={motorcycle.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {motorcycle.type}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  {getAvailabilityBadge()}
                </div>
              </div>
              
              {/* Quick Info Below Image */}
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Insurance</p>
                      <p className="font-body font-semibold text-foreground text-sm">Included</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Pick-up</p>
                      <p className="font-body font-semibold text-foreground text-sm">Same Day</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-muted-foreground">Dumaguete City, Negros Oriental</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneCall className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-muted-foreground">+63 912 345 6789</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body font-semibold text-foreground text-sm mb-1">Quick Reservation</p>
                      <p className="font-body text-xs text-muted-foreground">Book now and get instant confirmation. Valid license required.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Section - 7 columns */}
          <div className="col-span-7 mobile:col-span-4 space-y-6">
            {/* Title and Rating */}
            <div>
              <h2 className="text-4xl font-heading font-bold text-foreground mb-3">
                {motorcycle.name}
              </h2>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(motorcycle.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 font-body text-foreground">{motorcycle.rating}</span>
                <span className="ml-1 font-body text-muted-foreground">({motorcycle.reviewCount} reviews)</span>
              </div>
              
              <div className="text-4xl text-price font-heading font-bold mb-6">
                ₱{motorcycle.pricePerDay}
                <span className="text-lg font-body text-muted-foreground">/day</span>
              </div>
            </div>

            {/* Tabbed Content */}
            <Card className="card-hover">
              <Tabs defaultValue="specs" className="w-full">
                <CardHeader className="pb-3">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="specs">Specs</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="rental">Rental Info</TabsTrigger>
                    <TabsTrigger value="terms">Terms</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Specifications Tab */}
                  <TabsContent value="specs" className="mt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Gauge className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-body text-muted-foreground text-sm">Engine Capacity</p>
                          <p className="font-body font-semibold text-foreground">{motorcycle.engineCapacity}cc</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-body text-muted-foreground text-sm">Transmission</p>
                          <p className="font-body font-semibold text-foreground">{motorcycle.transmission}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-body text-muted-foreground text-sm">Model Year</p>
                          <p className="font-body font-semibold text-foreground">{motorcycle.year}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Palette className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-body text-muted-foreground text-sm">Color</p>
                          <p className="font-body font-semibold text-foreground">{motorcycle.color}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Fuel className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-body text-muted-foreground text-sm">Fuel Capacity</p>
                          <p className="font-body font-semibold text-foreground">{motorcycle.fuelCapacity}L</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-body text-muted-foreground text-sm">Fuel Type</p>
                          <p className="font-body font-semibold text-foreground">{motorcycle.fuelType}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-heading font-semibold text-foreground mb-3">Description</h4>
                      <p className="font-body text-muted-foreground leading-relaxed">
                        {motorcycle.description}
                      </p>
                    </div>
                  </TabsContent>

                  {/* Features Tab */}
                  <TabsContent value="features" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {motorcycle.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-success/5 border border-success/20">
                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                          <span className="font-body text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-heading font-semibold text-foreground">Safety & Comfort</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="font-body text-muted-foreground">Helmet Included (2)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="font-body text-muted-foreground">Raincoat Available</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="font-body text-muted-foreground">Maintenance Records</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="font-body text-muted-foreground">GPS Tracking</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Rental Information Tab */}
                  <TabsContent value="rental" className="mt-0 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                        <span className="font-body text-muted-foreground">Daily Rate</span>
                        <span className="font-body font-semibold text-accent">₱{motorcycle.pricePerDay}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                        <span className="font-body text-muted-foreground">Security Deposit</span>
                        <span className="font-body font-semibold text-foreground">₱{Math.round(motorcycle.pricePerDay * 0.2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                        <span className="font-body text-muted-foreground">Minimum Rental</span>
                        <span className="font-body font-semibold text-foreground">1 Day</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-heading font-semibold text-foreground">Pickup & Return</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-body font-medium text-foreground">Pickup Hours</p>
                            <p className="font-body text-muted-foreground">8:00 AM - 5:00 PM (Daily)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-body font-medium text-foreground">Location</p>
                            <p className="font-body text-muted-foreground">123 Rizal Boulevard, Dumaguete City</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Fuel className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-body font-medium text-foreground">Fuel Policy</p>
                            <p className="font-body text-muted-foreground">Return with same fuel level as pickup</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Terms & Conditions Tab */}
                  <TabsContent value="terms" className="mt-0 space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Requirements
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            <span className="font-body text-muted-foreground">Valid Driver's License (Original)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            <span className="font-body text-muted-foreground">Government-issued ID</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            <span className="font-body text-muted-foreground">Minimum age: 18 years old</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            <span className="font-body text-muted-foreground">Security deposit (refundable)</span>
                          </li>
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          Insurance & Coverage
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="font-body text-muted-foreground">Third-party liability insurance included</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="font-body text-muted-foreground">24/7 roadside assistance</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="font-body text-muted-foreground">Free replacement for mechanical issues</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Reserve Button */}
            <div className="space-y-3">
              <Button 
                onClick={handleReserve}
                className="w-full bg-primary hover:bg-primary-dark btn-hover"
                size="lg"
                disabled={motorcycle.availability !== 'Available'}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {motorcycle.availability !== 'Available' 
                  ? `${motorcycle.availability}` 
                  : 'Reserve Now'
                }
              </Button>
              
              <Button
                onClick={toggleFavorite}
                variant={isFavorited ? "default" : "outline"}
                size="lg"
                className="w-full gap-2"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
              
              {motorcycle.availability !== 'Available' && (
                <p className="font-body text-muted-foreground text-center text-sm">
                  This motorcycle is currently {motorcycle.availability.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Modal */}
      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-center">Complete Your Reservation</DialogTitle>
            <DialogDescription className="text-center">
              Please log in or create an account to reserve this motorcycle
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary-dark btn-hover"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
            
            <Button 
              onClick={handleSignUp}
              variant="outline"
              className="w-full btn-hover"
              size="lg"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </div>
          
          <p className="text-center font-body text-muted-foreground text-sm mt-4">
            Already have an account? Choose "Log In" above
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}