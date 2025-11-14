// Placeholder images - replace with actual image paths when available
const image_470e62d80324378dcb3133a5cd7873889906b3be = "/placeholder-landscape.jpg";
const image_fe900d6ad793a92f469cfab461f02cb1d66e5a10 = "/placeholder-motorcycle-1.jpg";
const image_bafefae1e0de735595fa6e52a09c1fa34d22d24f = "/placeholder-motorcycle-2.jpg";
const image_cac9bc6dbdea7d9fe58a1594c63101fb7adf3bfc = "/placeholder-hero.jpg";
const image_e254e706375d4c412148290e7a74cb7d77b84f59 = "/placeholder-motorcycle-3.jpg";
const image_75842442510e0e21e628f5009f46f074bc820a30 = "/placeholder-motorcycle-4.jpg";
const image_bee239b5a8791be2e0063baf0a64a0c259a8a18e = "/placeholder-motorcycle-5.jpg";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Bike,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  DollarSign,
  Users,
  MessageSquare,
  Send,
  Facebook,
  Instagram,
  Twitter,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motorcycleService } from "../services/motorcycleService";
import type { Page, Motorcycle, User } from "../App";

interface LandingPageProps {
  navigate: (page: Page) => void;
  continueAsGuest: () => void;
  initiateReservation: (motorcycle: Motorcycle) => void;
  user: User | null;
  isGuest: boolean;
}

/* Mock data removed - using real motorcycles from admin
const featuredMotorcycles: Motorcycle[] = [
  {
    id: "1",
    name: "Yamaha NMAX 155",
    type: "Scooter",
    engineCapacity: 155,
    transmission: "Automatic",
    year: 2023,
    color: "Matte Blue",
    fuelCapacity: 7.1,
    pricePerDay: 800,
    description:
      "Perfect for city riding with excellent fuel efficiency and comfortable seating.",
    image: image_bee239b5a8791be2e0063baf0a64a0c259a8a18e,
    features: [
      "Automatic CVT",
      "LED Headlight",
      "USB Charging",
    ],
    availability: "Available",
    rating: 4.8,
    reviewCount: 124,
    fuelType: "Gasoline",
  },
  {
    id: "2",
    name: "Honda Click 150i",
    type: "Scooter",
    engineCapacity: 150,
    transmission: "Automatic",
    year: 2024,
    color: "Pearl White",
    fuelCapacity: 5.5,
    pricePerDay: 750,
    description:
      "Reliable and easy to ride, ideal for beginners and city commuting.",
    image: image_fe900d6ad793a92f469cfab461f02cb1d66e5a10,
    features: ["Automatic CVT", "LED Lights", "Smart Key"],
    availability: "Available",
    rating: 4.6,
    reviewCount: 89,
    fuelType: "Gasoline",
  },
  {
    id: "3",
    name: "Honda PCX 160",
    type: "Scooter",
    engineCapacity: 157,
    transmission: "Automatic",
    year: 2024,
    color: "Matte Black",
    fuelCapacity: 8.1,
    pricePerDay: 900,
    description:
      "Premium scooter with advanced features and superior comfort for longer rides.",
    image: image_bafefae1e0de735595fa6e52a09c1fa34d22d24f,
    features: ["Smart Key", "USB Charging", "ABS Braking"],
    availability: "Available",
    rating: 4.7,
    reviewCount: 98,
    fuelType: "Gasoline",
  },
  {
    id: "4",
    name: "Suzuki Address 110",
    type: "Scooter",
    engineCapacity: 113,
    transmission: "Automatic",
    year: 2023,
    color: "Metallic Silver",
    fuelCapacity: 5.2,
    pricePerDay: 650,
    description:
      "Compact and economical scooter perfect for short trips around the city.",
    image: image_bee239b5a8791be2e0063baf0a64a0c259a8a18e,
    features: ["Lightweight", "Eco-Friendly", "LED Headlight"],
    availability: "Available",
    rating: 4.4,
    reviewCount: 156,
    fuelType: "Gasoline",
  },
  {
    id: "5",
    name: "Yamaha Aerox 155",
    type: "Scooter",
    engineCapacity: 155,
    transmission: "Automatic",
    year: 2024,
    color: "Racing Blue",
    fuelCapacity: 5.5,
    pricePerDay: 850,
    description:
      "Sporty design with powerful performance, perfect for adventurous riders.",
    image: image_fe900d6ad793a92f469cfab461f02cb1d66e5a10,
    features: ["Sport Mode", "Digital Display", "ABS Braking"],
    availability: "Available",
    rating: 4.7,
    reviewCount: 82,
    fuelType: "Gasoline",
  },
]; */

export function LandingPage({
  navigate,
  continueAsGuest,
  initiateReservation,
  user,
  isGuest,
}: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Load featured motorcycles on mount
  useEffect(() => {
    const loadMotorcycles = async () => {
      try {
        setLoading(true);
        const data = await motorcycleService.getAllMotorcycles();
        setMotorcycles(data);
      } catch (error) {
        console.error('Failed to load motorcycles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMotorcycles();
  }, []);
  
  // Use first 3 motorcycles as featured, or show placeholder
  const featuredMotorcycles = motorcycles.slice(0, 3);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-primary">
                MotoRent
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("motorcycles")}
                className="font-body font-medium text-primary hover:text-accent transition-colors"
              >
                Our Fleet
              </button>
              <button
                onClick={() => {
                  if (user || isGuest) {
                    navigate('home');
                  } else {
                    continueAsGuest();
                  }
                }}
                className="font-body font-medium text-primary hover:text-accent transition-colors"
              >
                Book Now
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="font-body font-medium text-primary hover:text-accent transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="font-body font-medium text-primary hover:text-accent transition-colors"
              >
                Contact
              </button>
              {user && (
                <button
                  onClick={() => navigate("home")}
                  className="font-body font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors px-4 py-2 rounded-md"
                >
                  Go to Dashboard
                </button>
              )}
              {!user && !isGuest && (
                <button
                  onClick={() => navigate("login")}
                  className="font-body font-medium bg-primary text-primary-foreground hover:bg-primary-dark transition-colors px-4 py-2 rounded-md"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-border">
            <div className="container-custom py-4 space-y-4">
              <button
                onClick={() => scrollToSection("motorcycles")}
                className="block w-full text-left font-body font-medium text-primary hover:text-accent py-2"
              >
                Rental Locations
              </button>
              <button
                onClick={() => {
                  if (user || isGuest) {
                    navigate('home');
                  } else {
                    continueAsGuest();
                  }
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left font-body font-medium text-primary hover:text-accent py-2"
              >
                Book Now
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="block w-full text-left font-body font-medium text-primary hover:text-accent py-2"
              >
                Guide
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="block w-full text-left font-body font-medium text-primary hover:text-accent py-2"
              >
                Contact
              </button>
              {user && (
                <button
                  onClick={() => {
                    navigate("home");
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left font-body font-medium bg-accent text-accent-foreground px-4 py-2 rounded-md"
                >
                  Go to Dashboard
                </button>
              )}
              {!user && !isGuest && (
                <button
                  onClick={() => {
                    navigate("login");
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left font-body font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center bg-white overflow-hidden pt-16"
      >
        {/* Diagonal Background Shape */}
        <div className="absolute top-0 right-0 w-2/3 h-full">
          <div className="absolute inset-0 bg-primary origin-top-left transform skew-x-[-12deg] translate-x-[20%]"></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:pr-12">
              {/* Main Heading */}
              <h1 className="md:text-5xl lg:text-6xl font-heading font-bold text-primary leading-tight text-[64px] mt-[0px] mr-[0px] mb-[60px] ml-[0px]">
                Discover the Best{" "}
                <span className="text-accent text-[96px]">
                  Motorcycle Rental Deals
                </span>{" "}
                in Dumaguete
              </h1>

              {/* Subheading */}
              <p className="text-lg text-muted-foreground leading-relaxed">
                Unlock the Wonders of Negros Oriental: Explore
                More with MotoRent's Wide Selection of
                Motorcycles!
              </p>

              {/* Trust Badges */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative lg:block hidden">
              <div className="relative z-10">
                <ImageWithFallback
                  src="/landingpage_image.jpg"
                  alt="Motorcycle rental in Dumaguete"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Motorcycle Listings */}
      <section id="motorcycles" className="py-20 bg-background">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Our Fleet
            </h2>
            <p className="text-lg font-body text-muted-foreground max-w-2xl mx-auto">
              Choose from our collection of well-maintained
              motorcycles, perfect for exploring Dumaguete and
              beyond.
            </p>
          </div>

          {/* Desktop: 3 per row, Mobile: 1 column */}
          {featuredMotorcycles.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Bike className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-heading text-lg mb-2">
                  No motorcycles available
                </h3>
                <p className="font-body text-muted-foreground">
                  Check back soon for available motorcycles.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredMotorcycles.map((motorcycle) => (
              <Card
                key={motorcycle.id}
                className="card-hover bg-card border border-border"
              >
                <div
                  className="relative overflow-hidden"
                  style={{ height: "var(--card-image-height)" }}
                >
                  <ImageWithFallback
                    src={motorcycle.image}
                    alt={motorcycle.name}
                    className="w-full h-full object-cover card-image"
                  />
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold">
                    {motorcycle.type}
                  </Badge>
                  <Badge className="absolute top-3 right-3 bg-success text-success-foreground text-xs font-semibold">
                    Available
                  </Badge>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                    {motorcycle.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(motorcycle.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-body text-muted-foreground">
                      ({motorcycle.reviewCount})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-body text-muted-foreground">
                    <div>
                      Engine: {motorcycle.engineCapacity}cc
                    </div>
                    <div>Type: {motorcycle.transmission}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-price text-2xl">
                      ₱{motorcycle.pricePerDay}
                      <span className="text-sm font-normal text-muted-foreground">
                        /day
                      </span>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary-dark btn-hover"
                      onClick={() => initiateReservation(motorcycle)}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-secondary">
        <div className="container-custom">
          <div className="grid-12 items-center gap-12">
            {/* Image - 6 columns */}
            <div className="col-span-6 mobile:col-span-4">
              <div className="relative">
                <ImageWithFallback
                  src="/about_image.jpg"
                  alt="Dumaguete landscape"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </div>

            {/* Content - 6 columns */}
            <div className="col-span-6 mobile:col-span-4">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
                About Dumaguete Motorcycle Rental
              </h2>

              <p className="text-lg font-body text-muted-foreground leading-relaxed mb-8">
                We are Dumaguete's premier motorcycle rental
                service, dedicated to providing safe, reliable,
                and affordable transportation solutions for
                locals and tourists alike. With years of
                experience and a commitment to excellence, we
                help you explore the beautiful sights of Negros
                Oriental with confidence.
              </p>

              {/* Icons with benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    Trust
                  </h3>
                  <p className="text-sm font-body text-muted-foreground">
                    Licensed and insured for your peace of mind
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    Quality
                  </h3>
                  <p className="text-sm font-body text-muted-foreground">
                    Well-maintained motorcycles with regular
                    service
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    Affordability
                  </h3>
                  <p className="text-sm font-body text-muted-foreground">
                    Competitive rates with transparent pricing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Support Section */}
      <section id="contact" className="py-20 bg-background">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-lg font-body text-muted-foreground max-w-2xl mx-auto">
              Have questions or need assistance? We're here to
              help make your Dumaguete adventure unforgettable.
            </p>
          </div>

          <div className="grid-12 gap-12">
            {/* Contact Form - 8 columns */}
            <div className="col-span-8 mobile:col-span-4">
              <Card className="bg-card border border-border">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
                    Send us a Message
                  </h3>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-body font-semibold text-foreground mb-2">
                          Name
                        </label>
                        <Input
                          placeholder="Your full name"
                          className="bg-input border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-body font-semibold text-foreground mb-2">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-body font-semibold text-foreground mb-2">
                        Message
                      </label>
                      <Textarea
                        placeholder="How can we help you?"
                        rows={5}
                        className="bg-input border-border"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-dark btn-hover"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info - 4 columns */}
            <div className="col-span-4 mobile:col-span-4">
              <div className="space-y-8">
                <Card className="bg-card border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-foreground">
                          Phone
                        </h4>
                        <p className="font-body text-muted-foreground">
                          +63 935 123 4567
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-foreground">
                          Email
                        </h4>
                        <p className="font-body text-muted-foreground">
                          info@dumaguete-moto.com
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-foreground">
                          Address
                        </h4>
                        <p className="font-body text-muted-foreground">
                          123 Rizal Boulevard
                          <br />
                          Dumaguete City, Negros Oriental
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media */}
                <div className="text-center">
                  <h4 className="font-heading font-semibold text-foreground mb-4">
                    Follow Us
                  </h4>
                  <div className="flex justify-center gap-4">
                    <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                      <Facebook className="w-5 h-5 text-primary-foreground" />
                    </button>
                    <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                      <Instagram className="w-5 h-5 text-primary-foreground" />
                    </button>
                    <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                      <Twitter className="w-5 h-5 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary py-16 border-t border-border">
        <div className="container-custom">
          <div className="grid-12 gap-8">
            {/* Company Info - 4 columns */}
            <div className="col-span-4 mobile:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Bike className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading font-bold text-foreground">
                  Dumaguete Moto
                </span>
              </div>
              <p className="font-body text-muted-foreground mb-6 leading-relaxed">
                Your trusted partner for motorcycle rentals in
                Dumaguete City. Explore Negros Oriental with
                confidence, safety, and style.
              </p>
              <div className="flex gap-4">
                <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                  <Facebook className="w-5 h-5 text-primary-foreground" />
                </button>
                <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                  <Instagram className="w-5 h-5 text-primary-foreground" />
                </button>
                <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                  <Twitter className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
            </div>

            {/* Quick Links - 2 columns */}
            <div className="col-span-2 mobile:col-span-2">
              <h4 className="font-heading font-semibold text-foreground mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() =>
                      scrollToSection("motorcycles")
                    }
                    className="font-body text-muted-foreground hover:text-primary transition-colors"
                  >
                    Our Fleet
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("about")}
                    className="font-body text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("contact")}
                    className="font-body text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("login")}
                    className="font-body text-muted-foreground hover:text-primary transition-colors"
                  >
                    Login
                  </button>
                </li>
              </ul>
            </div>

            {/* Services - 2 columns */}
            <div className="col-span-2 mobile:col-span-2">
              <h4 className="font-heading font-semibold text-foreground mb-4">
                Services
              </h4>
              <ul className="space-y-3">
                <li>
                  <span className="font-body text-muted-foreground">
                    Scooter Rentals
                  </span>
                </li>
                <li>
                  <span className="font-body text-muted-foreground">
                    Daily Rentals
                  </span>
                </li>
                <li>
                  <span className="font-body text-muted-foreground">
                    Weekly Rentals
                  </span>
                </li>
              </ul>
            </div>

            {/* Contact Info - 4 columns */}
            <div className="col-span-4 mobile:col-span-4">
              <h4 className="font-heading font-semibold text-foreground mb-4">
                Contact Info
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-body text-muted-foreground">
                    123 Rizal Boulevard, Dumaguete City
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="font-body text-muted-foreground">
                    +63 935 123 4567
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-body text-muted-foreground">
                    info@dumaguete-moto.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="font-body text-muted-foreground text-sm">
                © 2024 Dumaguete Moto. All rights reserved.
              </p>
              <div className="flex gap-6">
                <button className="font-body text-muted-foreground hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </button>
                <button className="font-body text-muted-foreground hover:text-primary transition-colors text-sm">
                  Terms of Service
                </button>
                <button
                  onClick={() => navigate("admin-login")}
                  className="font-body text-muted-foreground hover:text-accent transition-colors text-sm"
                >
                  Admin Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}