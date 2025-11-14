import { useState, useEffect } from 'react';
import { Motorcycle } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Fuel,
  Gauge,
  Calendar,
  Star,
  X,
  Loader2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { motorcycleService } from '../../services/motorcycleService';
import { storageService } from '../../services/storageService';
import { toDbMotorcycle } from '../../utils/supabaseHelpers';
import { toast } from 'sonner';

interface AdminMotorcyclesProps {}

export function AdminMotorcycles({}: AdminMotorcyclesProps) {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    try {
      setLoading(true);
      const data = await motorcycleService.getAllMotorcycles();
      setMotorcycles(data);
    } catch (error: any) {
      console.error('Error loading motorcycles:', error);
      toast.error('Failed to load motorcycles');
    } finally {
      setLoading(false);
    }
  };
  
  // Form state
  const [formData, setFormData] = useState<Partial<Motorcycle>>({
    brand: '',
    model: '',
    name: '',
    type: 'Scooter',
    engineCapacity: 125,
    transmission: 'Automatic',
    year: new Date().getFullYear(),
    color: '',
    plateNumber: '',
    fuelCapacity: 5,
    pricePerDay: 500,
    description: '',
    image: '',
    features: [],
    availability: 'Available',
    rating: 5,
    reviewCount: 0,
    fuelType: 'Gasoline',
    mileage: undefined
  });
  const [featureInput, setFeatureInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file
      storageService.validateImageFile(file);
      
      // Set file and create preview
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      toast.success('Image selected. Click Save to upload.');
    } catch (error: any) {
      toast.error(error.message);
      e.target.value = ''; // Clear input
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploading(true);
      const imageUrl = await storageService.uploadMotorcycleImage(imageFile);
      toast.success('Image uploaded successfully!');
      return imageUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Clear image selection
  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview('');
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const filteredMotorcycles = motorcycles.filter(motorcycle => {
    return motorcycle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           motorcycle.type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-success/10 text-success border-success/20';
      case 'Reserved': return 'bg-warning/10 text-warning border-warning/20';
      case 'In Maintenance': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      name: '',
      type: 'Scooter',
      engineCapacity: 125,
      transmission: 'Automatic',
      year: new Date().getFullYear(),
      color: '',
      plateNumber: '',
      fuelCapacity: 5,
      pricePerDay: 500,
      description: '',
      image: '',
      features: [],
      availability: 'Available',
      rating: 5,
      reviewCount: 0,
      fuelType: 'Gasoline',
      mileage: undefined
    });
    setFeatureInput('');
    setFormErrors({});
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    if (!formData.brand?.trim()) {
      errors.brand = 'Brand is required';
    }

    if (!formData.model?.trim()) {
      errors.model = 'Model is required';
    }

    if (!formData.engineCapacity || formData.engineCapacity < 50 || formData.engineCapacity > 2000) {
      errors.engineCapacity = 'Engine capacity must be between 50cc and 2000cc';
    }

    if (!formData.year || formData.year < 1990 || formData.year > currentYear + 1) {
      errors.year = `Year must be between 1990 and ${currentYear + 1}`;
    }

    if (!formData.color?.trim()) {
      errors.color = 'Color is required';
    }

    if (formData.plateNumber && formData.plateNumber.length > 10) {
      errors.plateNumber = 'Plate number must be 10 characters or less';
    }

    if (!formData.pricePerDay || formData.pricePerDay < 100 || formData.pricePerDay > 10000) {
      errors.pricePerDay = 'Rental price must be between ₱100 and ₱10,000';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (formData.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    if (formData.mileage && formData.mileage < 0) {
      errors.mileage = 'Mileage cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMotorcycle = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);
      
      // Upload image first if a file was selected
      let imageUrl = formData.image || '';
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          throw new Error('Image upload failed');
        }
      }
      
      // Construct name from brand and model
      const motorcycleName = `${formData.brand} ${formData.model}`.trim();
      
      const newMotorcycle: Motorcycle = {
        id: '', // Will be generated by Supabase
        brand: formData.brand || '',
        model: formData.model || '',
        name: motorcycleName,
        type: formData.type || 'Scooter',
        engineCapacity: formData.engineCapacity || 125,
        transmission: formData.transmission || 'Automatic',
        year: formData.year || new Date().getFullYear(),
        color: formData.color || '',
        plateNumber: formData.plateNumber,
        fuelCapacity: formData.fuelCapacity || 5,
        pricePerDay: formData.pricePerDay || 500,
        description: formData.description || '',
        image: imageUrl,
        features: formData.features || [],
        availability: formData.availability || 'Available',
        rating: formData.rating || 5,
        reviewCount: formData.reviewCount || 0,
        fuelType: formData.fuelType || 'Gasoline',
        mileage: formData.mileage
      };
      
      // Convert to database format and remove id for insert
      const dbMotorcycle = toDbMotorcycle(newMotorcycle);
      const { id, ...motorcycleData } = dbMotorcycle; // Remove id field
      
      // Save to database
      await motorcycleService.createMotorcycle(motorcycleData);
      
      toast.success('Motorcycle added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      clearImageSelection();
      
      // Reload the list
      await loadMotorcycles();
    } catch (error: any) {
      console.error('Error adding motorcycle:', error);
      toast.error('Failed to add motorcycle: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMotorcycle = async () => {
    if (!editingMotorcycle) return;
    
    try {
      setSaving(true);
      
      const updatedMotorcycle: Motorcycle = {
        ...editingMotorcycle,
        name: formData.name || editingMotorcycle.name,
        type: formData.type || editingMotorcycle.type,
        engineCapacity: formData.engineCapacity ?? editingMotorcycle.engineCapacity,
        transmission: formData.transmission || editingMotorcycle.transmission,
        year: formData.year ?? editingMotorcycle.year,
        color: formData.color || editingMotorcycle.color,
        fuelCapacity: formData.fuelCapacity ?? editingMotorcycle.fuelCapacity,
        pricePerDay: formData.pricePerDay ?? editingMotorcycle.pricePerDay,
        description: formData.description || editingMotorcycle.description,
        image: formData.image || editingMotorcycle.image,
        features: formData.features || editingMotorcycle.features,
        availability: formData.availability || editingMotorcycle.availability,
        rating: formData.rating ?? editingMotorcycle.rating,
        reviewCount: formData.reviewCount ?? editingMotorcycle.reviewCount,
        fuelType: formData.fuelType || editingMotorcycle.fuelType
      };
      
      // Convert to database format
      const dbMotorcycle = toDbMotorcycle(updatedMotorcycle);
      
      // Update in database
      await motorcycleService.updateMotorcycle(editingMotorcycle.id, dbMotorcycle);
      
      toast.success('Motorcycle updated successfully');
      setIsEditDialogOpen(false);
      setEditingMotorcycle(null);
      resetForm();
      
      // Reload the list
      await loadMotorcycles();
    } catch (error: any) {
      console.error('Error updating motorcycle:', error);
      toast.error('Failed to update motorcycle: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (motorcycle: Motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setFormData(motorcycle);
    setIsEditDialogOpen(true);
  };

  const handleDeleteMotorcycle = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this motorcycle? This action cannot be undone.')) {
      return;
    }
    
    try {
      await motorcycleService.deleteMotorcycle(id);
      toast.success('Motorcycle deleted successfully');
      
      // Reload the list
      await loadMotorcycles();
    } catch (error: any) {
      console.error('Error deleting motorcycle:', error);
      
      // Show user-friendly error message
      if (error.message?.includes('active reservations')) {
        toast.error('Cannot delete: This motorcycle has active reservations. Please cancel or complete them first.');
      } else {
        toast.error('Failed to delete motorcycle: ' + error.message);
      }
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  const renderMotorcycleForm = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        {/* Brand */}
        <div>
          <Label htmlFor="brand" className="flex items-center gap-1">
            Brand <span className="text-destructive">*</span>
          </Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, brand: e.target.value }));
              if (formErrors.brand) setFormErrors(prev => ({ ...prev, brand: '' }));
            }}
            placeholder="e.g., Honda, Yamaha"
            className={formErrors.brand ? 'border-destructive' : ''}
          />
          {formErrors.brand && (
            <p className="text-xs text-destructive mt-1">{formErrors.brand}</p>
          )}
        </div>

        {/* Model */}
        <div>
          <Label htmlFor="model" className="flex items-center gap-1">
            Model <span className="text-destructive">*</span>
          </Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, model: e.target.value }));
              if (formErrors.model) setFormErrors(prev => ({ ...prev, model: '' }));
            }}
            placeholder="e.g., Click 150i, NMAX"
            className={formErrors.model ? 'border-destructive' : ''}
          />
          {formErrors.model && (
            <p className="text-xs text-destructive mt-1">{formErrors.model}</p>
          )}
        </div>

        {/* Year */}
        <div>
          <Label htmlFor="year" className="flex items-center gap-1">
            Year <span className="text-destructive">*</span>
          </Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }));
              if (formErrors.year) setFormErrors(prev => ({ ...prev, year: '' }));
            }}
            placeholder={`e.g., ${new Date().getFullYear()}`}
            min="1990"
            max={new Date().getFullYear() + 1}
            className={formErrors.year ? 'border-destructive' : ''}
          />
          {formErrors.year && (
            <p className="text-xs text-destructive mt-1">{formErrors.year}</p>
          )}
        </div>

        {/* Engine Capacity */}
        <div>
          <Label htmlFor="engineCapacity" className="flex items-center gap-1">
            Engine Capacity (cc) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="engineCapacity"
            type="number"
            value={formData.engineCapacity}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, engineCapacity: parseInt(e.target.value) || 0 }));
              if (formErrors.engineCapacity) setFormErrors(prev => ({ ...prev, engineCapacity: '' }));
            }}
            placeholder="e.g., 125, 150"
            min="50"
            max="2000"
            className={formErrors.engineCapacity ? 'border-destructive' : ''}
          />
          {formErrors.engineCapacity && (
            <p className="text-xs text-destructive mt-1">{formErrors.engineCapacity}</p>
          )}
        </div>

        {/* Transmission Type */}
        <div>
          <Label htmlFor="transmission" className="flex items-center gap-1">
            Transmission Type <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.transmission} 
            onValueChange={(value: 'Automatic' | 'Manual') => setFormData(prev => ({ ...prev, transmission: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Automatic">Automatic</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fuel Type */}
        <div>
          <Label htmlFor="fuelType" className="flex items-center gap-1">
            Fuel Type <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.fuelType} 
            onValueChange={(value: 'Gasoline' | 'Electric') => setFormData(prev => ({ ...prev, fuelType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gasoline">Gasoline</SelectItem>
              <SelectItem value="Electric">Electric</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plate Number */}
        <div>
          <Label htmlFor="plateNumber">
            Plate Number
          </Label>
          <Input
            id="plateNumber"
            value={formData.plateNumber}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, plateNumber: e.target.value }));
              if (formErrors.plateNumber) setFormErrors(prev => ({ ...prev, plateNumber: '' }));
            }}
            placeholder="e.g., ABC-1234"
            maxLength={10}
            className={formErrors.plateNumber ? 'border-destructive' : ''}
          />
          {formErrors.plateNumber && (
            <p className="text-xs text-destructive mt-1">{formErrors.plateNumber}</p>
          )}
        </div>

        {/* Color */}
        <div>
          <Label htmlFor="color" className="flex items-center gap-1">
            Color <span className="text-destructive">*</span>
          </Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, color: e.target.value }));
              if (formErrors.color) setFormErrors(prev => ({ ...prev, color: '' }));
            }}
            placeholder="e.g., Matte Blue, Pearl White"
            className={formErrors.color ? 'border-destructive' : ''}
          />
          {formErrors.color && (
            <p className="text-xs text-destructive mt-1">{formErrors.color}</p>
          )}
        </div>

        {/* Rental Price Per Day */}
        <div>
          <Label htmlFor="pricePerDay" className="flex items-center gap-1">
            Rental Price per Day (₱) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pricePerDay"
            type="number"
            value={formData.pricePerDay}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, pricePerDay: parseInt(e.target.value) || 0 }));
              if (formErrors.pricePerDay) setFormErrors(prev => ({ ...prev, pricePerDay: '' }));
            }}
            placeholder="e.g., 500, 800"
            min="100"
            max="10000"
            className={formErrors.pricePerDay ? 'border-destructive' : ''}
          />
          {formErrors.pricePerDay && (
            <p className="text-xs text-destructive mt-1">{formErrors.pricePerDay}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Between ₱100 - ₱10,000</p>
        </div>

        {/* Availability Status */}
        <div>
          <Label htmlFor="availability" className="flex items-center gap-1">
            Availability Status <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.availability} 
            onValueChange={(value: 'Available' | 'Reserved' | 'In Maintenance') => setFormData(prev => ({ ...prev, availability: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Reserved">Rented</SelectItem>
              <SelectItem value="In Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mileage (Optional) */}
        <div>
          <Label htmlFor="mileage">
            Mileage (km) <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="mileage"
            type="number"
            value={formData.mileage || ''}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, mileage: e.target.value ? parseInt(e.target.value) : undefined }));
              if (formErrors.mileage) setFormErrors(prev => ({ ...prev, mileage: '' }));
            }}
            placeholder="e.g., 5000"
            min="0"
            className={formErrors.mileage ? 'border-destructive' : ''}
          />
          {formErrors.mileage && (
            <p className="text-xs text-destructive mt-1">{formErrors.mileage}</p>
          )}
        </div>

        {/* Motorcycle Image Upload */}
        <div className="col-span-2">
          <Label htmlFor="image" className="flex items-center gap-1">
            Motorcycle Image <span className="text-muted-foreground text-xs">(recommended)</span>
          </Label>
          
          {/* File Upload Option */}
          <div className="space-y-3">
            <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                {imagePreview || formData.image ? (
                  <div className="space-y-2">
                    <ImageWithFallback
                      src={imagePreview || formData.image}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('imageUpload')?.click();
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            clearImageSelection();
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP up to 5MB
                    </p>
                  </div>
                )}
              </label>
            </div>
            
            {/* Or use URL */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use image URL
                </span>
              </div>
            </div>
            
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              disabled={!!imageFile}
            />
            <p className="text-xs text-muted-foreground">
              Upload from computer or paste <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-primary underline">Imgur</a> URL
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <Label htmlFor="description" className="flex items-center gap-1">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, description: e.target.value }));
              if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' }));
            }}
            placeholder="Describe the motorcycle features, condition, and any important details..."
            rows={4}
            maxLength={500}
            className={formErrors.description ? 'border-destructive' : ''}
          />
          <div className="flex justify-between items-center mt-1">
            {formErrors.description ? (
              <p className="text-xs text-destructive">{formErrors.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground">20-500 characters</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description?.length || 0}/500
            </p>
          </div>
        </div>

        {/* Features (Optional) */}
        <div className="col-span-2">
          <Label>
            Features <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Add a feature (e.g., USB Charging, LED Lights)..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <Button type="button" onClick={addFeature} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features?.map((feature, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {feature}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeFeature(index)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading motorcycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Motorcycle Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your motorcycle fleet and availability ({motorcycles.length} total)
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
          <Plus className="w-4 h-4 mr-2" />
          Add Motorcycle
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search motorcycles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Motorcycles Grid */}
      {filteredMotorcycles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMotorcycles.map((motorcycle) => (
            <Card key={motorcycle.id} className="card-hover">
              <div className="relative">
                <ImageWithFallback
                  src={motorcycle.image}
                  alt={motorcycle.name}
                  className="w-full h-48 object-cover rounded-t-lg card-image"
                />
                <Badge 
                  className={`absolute top-3 right-3 ${getStatusColor(motorcycle.availability)}`}
                >
                  {motorcycle.availability}
                </Badge>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{motorcycle.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">{motorcycle.rating}</span>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {motorcycle.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <span>{motorcycle.engineCapacity}cc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{motorcycle.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-muted-foreground" />
                    <span>{motorcycle.fuelType}</span>
                  </div>
                  <div className="text-price">
                    ₱{motorcycle.pricePerDay}/day
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditDialog(motorcycle)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteMotorcycle(motorcycle.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fuel className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {motorcycles.length === 0 ? 'No motorcycles yet' : 'No motorcycles found'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {motorcycles.length === 0 
                ? 'Add your first motorcycle to get started.'
                : 'Try adjusting your search criteria.'
              }
            </p>
            {motorcycles.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Motorcycle
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Motorcycle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Motorcycle</DialogTitle>
            <DialogDescription>
              Fill in the required details to add a new motorcycle to your fleet. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {renderMotorcycleForm()}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { 
                setIsAddDialogOpen(false); 
                resetForm(); 
                clearImageSelection(); 
              }} 
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMotorcycle} 
              disabled={saving || uploading}
            >
              {(saving || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? 'Uploading Image...' : saving ? 'Adding Motorcycle...' : 'Add Motorcycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Motorcycle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Motorcycle</DialogTitle>
            <DialogDescription>
              Update the motorcycle details below.
            </DialogDescription>
          </DialogHeader>
          {renderMotorcycleForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingMotorcycle(null); resetForm(); }} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEditMotorcycle} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
