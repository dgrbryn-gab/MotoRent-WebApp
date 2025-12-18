import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Calendar, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, FileText, Camera, FileCheck, MapPin, ChevronDown, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { reservationService } from '../services/reservationService';
import { transactionService } from '../services/transactionService';
import { motorcycleService } from '../services/motorcycleService';
import { emailService } from '../services/emailService';
import { userService } from '../services/userService';
import { documentService } from '../services/documentService';
import { createPaymentIntent } from '../services/paymentService';
import type { Page, Motorcycle, User } from '../App';
import { format } from 'date-fns';

interface BookingPageProps {
  motorcycle: Motorcycle;
  navigate: (page: Page) => void;
  user: User | null;
  addReservation: (reservation: import('../App').Reservation) => void;
  addTransaction: (transaction: import('../App').Transaction) => void;
}

interface DocumentUpload {
  id: string;
  name: string;
  file: File | null;
  status: 'pending' | 'uploading' | 'analyzing' | 'verified' | 'rejected';
  required: boolean;
  description: string;
  uploadProgress: number;
  rejectionReason?: string;
  extractedData?: {
    documentType?: string;
    expirationDate?: string;
    isExpired?: boolean;
  };
}

type BookingStep = 'details' | 'documents' | 'payment' | 'confirmation';

export function BookingPage({ motorcycle, navigate, user, addReservation, addTransaction }: BookingPageProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('details');
  
  // Customer Information
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.birthday || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.license_number || '');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  
  // Reservation Details - simplified to just pickup date/time
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState(''); // Auto-calculated from pickup time
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Calendar states
  const [pickupCalendarOpen, setPickupCalendarOpen] = useState(false);
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false);

  // Generate time options (8 AM to 5 PM)
  const timeOptions = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    // Fix: 12 should be PM (noon), not AM (midnight)
    const time12 = hour >= 12 ? `${hour > 12 ? hour - 12 : 12}:00 PM` : `${hour}:00 AM`;
    const time24 = `${hour.toString().padStart(2, '0')}:00`;
    return { value: time24, label: time12 };
  });

  // Auto-set return time to exactly 24 hours after pickup time
  useEffect(() => {
    if (pickupTime) {
      // Return time is the same as pickup time (24 hours later)
      setReturnTime(pickupTime);
    }
  }, [pickupTime]);

  // Load latest user profile data on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const userProfile = await userService.getUserById(user.id);
          if (userProfile) {
            setFullName(userProfile.name || '');
            setEmail(userProfile.email || '');
            setPhone(userProfile.phone || '');
            setAddress(userProfile.address || '');
            setDateOfBirth(userProfile.birthday || '');
            setLicenseNumber(userProfile.license_number || '');
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [user?.id]);

  // Document Management
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);

  // File upload refs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | ''>('');

  // Validation functions
  const validateFileSize = (file: File): boolean => {
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSizeBytes;
  };

  const validateFileType = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    return allowedTypes.includes(file.type);
  };

  // Simulated OCR text extraction with enhanced validation
  const simulateOCRExtraction = async (file: File, documentId: string): Promise<void> => {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (documentId === 'license') {
      // For driver's license, mark as verified immediately
      // Admin will manually verify the actual document during reservation approval
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { 
              ...doc, 
              status: 'verified', 
              uploadProgress: 100,
              extractedData: {
                documentType: 'Driver\'s License',
                expirationDate: 'Pending admin verification',
                isExpired: false
              }
            }
          : doc
      ));
      
      toast.success('Driver\'s license uploaded successfully', {
        description: 'Your document will be verified by admin during reservation review.'
      });
    }
  };

  const handleFileUpload = async (documentId: string, file: File) => {
    console.log('📤 File upload triggered:', { documentId, fileName: file.name, fileType: file.type, fileSize: file.size });
    
    // File validation
    if (!validateFileType(file)) {
      console.error('❌ Invalid file type:', file.type);
      toast.error('Invalid file format', {
        description: 'Please upload a JPG, PNG, or PDF file.'
      });
      return;
    }

    if (!validateFileSize(file)) {
      console.error('❌ File too large:', file.size);
      toast.error('File too large', {
        description: 'File size must be less than 5MB.'
      });
      return;
    }

    console.log('✅ File validation passed');

    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, file, status: 'uploading', uploadProgress: 0, rejectionReason: undefined }
        : doc
    ));

    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 90) {
        progress = 90;
        clearInterval(uploadInterval);
        
        console.log('📊 Upload progress: 90%, starting analysis...');
        
        // Start analysis phase
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'analyzing', uploadProgress: 90 }
            : doc
        ));

        // Perform OCR analysis
        simulateOCRExtraction(file, documentId);
      } else {
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, uploadProgress: progress }
            : doc
        ));
      }
    }, 300);
  };

  const triggerFileUpload = (documentId: string) => {
    console.log('🖱️ Trigger file upload clicked for:', documentId);
    const fileInput = fileInputRefs.current[documentId];
    console.log('📎 File input element:', fileInput ? 'Found' : 'NOT FOUND');
    if (fileInput) {
      fileInput.click();
      console.log('✅ File input clicked');
    } else {
      console.error('❌ File input ref not found for:', documentId);
    }
  };

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 0;
    const diffTime = Math.abs(returnDate.getTime() - pickupDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Minimum rental period is 1 day
    return Math.max(diffDays, 1);
  };

  const totalDays = calculateDays();
  const subtotal = totalDays * motorcycle.pricePerDay;
  const securityDeposit = Math.round(subtotal * 0.20); // 20% of rental amount
  const total = subtotal + securityDeposit;

  const getDocumentStatusIcon = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'uploading':
        return <AlertCircle className="w-5 h-5 text-warning animate-pulse" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getDocumentStatusBadge = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-error text-error-foreground">Rejected</Badge>;
      case 'uploading':
        return <Badge className="bg-warning text-warning-foreground">Processing</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const requiredDocumentsUploaded = documents
    .filter(doc => doc.required)
    .every(doc => doc.status === 'verified') || user?.driver_license_url; // Allow if license is in profile

  // Validation helpers
  const validateAge = (dob: string) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const canProceedToDocuments = 
    pickupDate && 
    pickupTime && 
    returnDate && 
    fullName.trim() && 
    email.trim() && 
    phone.trim() && 
    address.trim() && 
    dateOfBirth && 
    validateAge(dateOfBirth) &&
    licenseNumber.trim() &&
    emergencyContactName.trim() &&
    emergencyContactPhone.trim();
  
  const canProceedToPayment = requiredDocumentsUploaded;
  const canProceedToConfirmation = paymentMethod === 'cash';

  const generateReferenceNumber = () => {
    return 'DMR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleConfirmReservation = async () => {
    // Validation
    if (!pickupDate || !returnDate) {
      toast.error('Please select pickup and return dates');
      return;
    }
    
    if (!pickupTime) {
      toast.error('Please select a pickup time');
      return;
    }
    
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    
    if (!user) {
      toast.error('Please login to create a reservation');
      return;
    }

    if (!user.id) {
      toast.error('User ID is missing. Please login again.');
      return;
    }
    
    const refNumber = generateReferenceNumber();
    setReferenceNumber(refNumber);
    
    // Recalculate with current values
    const totalDays = calculateDays();
    const pricePerDay = motorcycle.pricePerDay || 0;
    const subtotal = totalDays * pricePerDay;
    const securityDeposit = Math.round(subtotal * 0.20);
    const total = subtotal + securityDeposit;
    
    console.log('📊 Booking calculation:', {
      pickupDate: pickupDate.toISOString(),
      returnDate: returnDate.toISOString(),
      totalDays,
      pricePerDay,
      subtotal,
      securityDeposit,
      total,
      isNaN: isNaN(total),
      motorcycleId: motorcycle.id,
      motorcycleName: motorcycle.name
    });
    
    if (!total || isNaN(total) || total <= 0) {
      toast.error(`Invalid booking total (${total}). Days: ${totalDays}, Price: ${pricePerDay}`);
      return;
    }
    
    try {
      console.log('Creating reservation with user ID:', user.id);
      console.log('Motorcycle ID:', motorcycle.id);
      
      // Ensure user exists in database before creating reservation
      try {
        const existingUser = await userService.getUserById(user.id);
        if (!existingUser) {
          console.log('User not found in database, creating user record...');
          await userService.createUser({
            id: user.id,
            name: fullName,
            email: email,
            phone: phone,
          });
          console.log('✅ User record created successfully');
        } else {
          // Update user with latest information
          await userService.updateUser(user.id, {
            name: fullName,
            email: email,
            phone: phone,
          });
          console.log('✅ User record updated successfully');
        }
      } catch (userError) {
        console.error('Error checking/creating user:', userError);
        // Continue anyway - the error might be handled by the reservation creation
      }
      
      // Prepare customer details for admin notes
      const customerDetails = `
📋 CUSTOMER INFORMATION:
Name: ${fullName}
Email: ${email}
Phone: ${phone}
Address: ${address}
Date of Birth: ${dateOfBirth}
Driver's License #: ${licenseNumber}

🚨 EMERGENCY CONTACT:
Name: ${emergencyContactName}
Phone: ${emergencyContactPhone}

${notes ? `\n📝 ADDITIONAL NOTES:\n${notes}` : ''}
      `.trim();
      
      const reservationData = {
        user_id: user.id,
        motorcycle_id: motorcycle.id,
        start_date: pickupDate.toISOString().split('T')[0],
        end_date: returnDate.toISOString().split('T')[0],
        pickup_time: pickupTime || null,
        return_time: returnTime || null,
        total_price: Number(total), // Ensure it's a number
        status: 'pending' as const,
        customer_name: fullName,
        customer_email: email,
        customer_phone: phone,
        payment_method: (paymentMethod || null) as 'cash' | null,
        admin_notes: customerDetails,
      };
      
      console.log('📝 Reservation data being sent:', reservationData);
      
      // Create reservation in Supabase
      const newReservation = await reservationService.createReservation(reservationData);

      // Create payment transaction with breakdown
      const paymentDescription = `Payment for ${motorcycle.name} rental (${pickupDate.toLocaleDateString()} - ${returnDate.toLocaleDateString()}) | Subtotal: ₱${subtotal} | Security Deposit: ₱${securityDeposit} | Total: ₱${total}`;
      
      // Create TRANSACTION record (simplified tracking for internal use)
      await transactionService.createTransaction({
        user_id: user.id,
        reservation_id: (newReservation as any).id,
        type: 'payment',
        amount: total,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        description: paymentDescription,
      });

      // Create PAYMENT record (detailed tracking, ready for future Stripe integration)
      const { payment } = await createPaymentIntent({
        reservationId: (newReservation as any).id,
        userId: user.id,
        amount: total,
        currency: 'PHP',
        paymentMethod: 'cash',
        metadata: {
          motorcycle_id: motorcycle.id,
          motorcycle_name: motorcycle.name,
          pickup_date: pickupDate.toISOString(),
          return_date: returnDate.toISOString(),
          rental_days: totalDays,
          customer_name: fullName,
          customer_email: email,
          customer_phone: phone,
          subtotal: subtotal,
          security_deposit: securityDeposit,
          breakdown: `Rental: ₱${subtotal} + Security Deposit: ₱${securityDeposit}`,
        }
      });
      console.log('✅ Payment record created:', payment.id);

      // Note: Security deposit is included in the total payment above, no separate transaction needed

      // Update motorcycle availability to 'Reserved'
      await motorcycleService.updateMotorcycle(motorcycle.id, { availability: 'Reserved' });

      // Driver's license is now managed in user profile, no need to upload here
      console.log('✅ Using driver\'s license from user profile:', user.driver_license_url);

      // Send booking confirmation email
      try {
        await emailService.sendBookingConfirmation({
          userEmail: user.email,
          userName: user.name,
          motorcycleName: motorcycle.name,
          startDate: format(pickupDate, 'PPP') + (pickupTime ? ` at ${pickupTime}` : ''),
          endDate: format(returnDate, 'PPP') + (returnTime ? ` at ${returnTime}` : ''),
          totalPrice: total,
          reservationId: (newReservation as any).id,
        });
        console.log('✅ Booking confirmation email sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      // Success! Show confirmation and navigate
      toast.success('Booking created successfully!');
      setCurrentStep('confirmation');
      
    } catch (error: any) {
      console.error('❌ Failed to create booking - Full error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Show detailed error to user
      const errorMsg = error.message || 'Unknown error';
      toast.error(`Failed to create booking: ${errorMsg}`);
    }
  };

  const renderStepIndicator = () => (
    <div className="container-custom mb-8 mt-4">
      <div className="grid-12">
        <div className="col-span-12">
          <div className="flex items-center justify-center space-x-2 md:space-x-4 py-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === 'details' ? 'bg-primary text-primary-foreground' : 
                currentStep === 'documents' || currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-success text-success-foreground' : 
                'bg-muted text-muted-foreground'
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
              <span className="ml-2 font-heading font-semibold text-foreground hidden lg:inline">
                Schedule
              </span>
            </div>

            <div className="w-4 md:w-8 h-0.5 bg-border"></div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === 'documents' ? 'bg-primary text-primary-foreground' : 
                currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-success text-success-foreground' : 
                'bg-muted text-muted-foreground'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <span className="ml-2 font-heading font-semibold text-foreground hidden lg:inline">
                Documents
              </span>
            </div>

            <div className="w-4 md:w-8 h-0.5 bg-border"></div>

            {/* Step 3 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === 'payment' ? 'bg-primary text-primary-foreground' : 
                currentStep === 'confirmation' ? 'bg-success text-success-foreground' : 
                'bg-muted text-muted-foreground'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="ml-2 font-heading font-semibold text-foreground hidden lg:inline">
                Payment
              </span>
            </div>

            <div className="w-4 md:w-8 h-0.5 bg-border"></div>

            {/* Step 4 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === 'confirmation' ? 'bg-primary text-primary-foreground' : 
                'bg-muted text-muted-foreground'
              }`}>
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="ml-2 font-heading font-semibold text-foreground hidden lg:inline">
                Confirm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="container-custom pb-12">
      <div className="grid-12 gap-8">
        {/* Form Section - 8 columns */}
        <div className="col-span-8 mobile:col-span-4 space-y-6">
          {/* Shop Pickup Information */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center font-heading">
                <MapPin className="w-5 h-5 mr-2" />
                Pickup Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-secondary rounded-lg border border-border">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Dumaguete Moto Shop</h3>
                    <p className="font-body text-muted-foreground">123 Rizal Boulevard</p>
                    <p className="font-body text-muted-foreground">Dumaguete City, Negros Oriental</p>
                    <p className="font-body text-muted-foreground text-sm mt-2">
                      📞 +63 935 123 4567 | ⏰ Open Daily: 8:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center font-heading">
                <UserIcon className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-label">Full Name *</Label>
                  <Input
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-label">Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="juan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-label">Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-label">Date of Birth *</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className="bg-input border-border"
                  />
                  {dateOfBirth && !validateAge(dateOfBirth) && (
                    <p className="text-sm text-destructive">You must be at least 18 years old</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-label">Complete Address *</Label>
                <Input
                  type="text"
                  placeholder="123 Street Name, Barangay, City, Province"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-label">Driver's License Number *</Label>
                <Input
                  type="text"
                  placeholder="N01-12-345678"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="bg-input border-border"
                />
                {user?.driver_license_url ? (
                  <p className="text-sm text-success flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Driver's license uploaded to your profile
                  </p>
                ) : (
                  <p className="text-sm text-warning">
                    ⚠️ Please upload your driver's license in your profile before completing booking
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-label">Contact Name *</Label>
                    <Input
                      type="text"
                      placeholder="Emergency contact person"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-label">Contact Phone *</Label>
                    <Input
                      type="tel"
                      placeholder="+63 912 345 6789"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center font-heading">
                <Calendar className="w-5 h-5 mr-2" />
                Rental Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-label">Pickup Date *</Label>
                  <Popover open={pickupCalendarOpen} onOpenChange={setPickupCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !pickupDate && "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {pickupDate ? format(pickupDate, "PPP") : "Select pickup date"}
                        <ChevronDown className="ml-auto h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={pickupDate}
                        onSelect={(date) => {
                          setPickupDate(date);
                          setPickupCalendarOpen(false);
                        }}
                        disabled={(date) => {
                          const now = new Date();
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          const selectedDate = new Date(date);
                          selectedDate.setHours(0, 0, 0, 0);
                          
                          // Disable past dates
                          if (selectedDate < today) return true;
                          
                          // If selecting today, check if current time is past 5 PM (17:00)
                          if (selectedDate.getTime() === today.getTime()) {
                            const currentHour = now.getHours();
                            if (currentHour >= 17) return true; // Disable if 5 PM or later
                          }
                          
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {pickupDate && (
                    <p className="text-sm font-body text-muted-foreground">
                      Selected: {format(pickupDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                  {!pickupDate && (() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    if (currentHour >= 17) {
                      return (
                        <p className="text-sm font-body text-warning">
                          ⚠️ Same-day pickup is not available after 5:00 PM. Please select a future date.
                        </p>
                      );
                    }
                    return (
                      <p className="text-sm font-body text-info">
                        ✓ Same-day pickup available until 5:00 PM
                      </p>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <Label className="text-label">Pickup Time *</Label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pickup time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm font-body text-muted-foreground">
                    Shop hours: 8:00 AM - 5:00 PM
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-label">Return Date & Time *</Label>
                <Popover open={returnCalendarOpen} onOpenChange={setReturnCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !returnDate && "text-muted-foreground"
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "PPP") : "Select return date"}
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={returnDate}
                      onSelect={(date) => {
                        setReturnDate(date);
                        setReturnCalendarOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        // Disable if date is in the past
                        if (date < today) return true;
                        
                        // Disable if no pickup date selected
                        if (!pickupDate) return true;
                        
                        // Disable if return date is same as pickup date (minimum 1 day rental)
                        const pickupDateOnly = new Date(pickupDate);
                        pickupDateOnly.setHours(0, 0, 0, 0);
                        const dateOnly = new Date(date);
                        dateOnly.setHours(0, 0, 0, 0);
                        
                        if (dateOnly.getTime() <= pickupDateOnly.getTime()) return true;
                        
                        return false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {pickupDate && pickupTime && !returnDate && (
                  <p className="text-sm font-body text-info">
                    📌 Please select a return date at least 1 day after pickup date
                  </p>
                )}
                {returnDate && pickupTime && returnTime && (
                  <p className="text-sm font-body text-muted-foreground">
                    Return by <span className="font-semibold">{timeOptions.find(t => t.value === returnTime)?.label}</span> on {format(returnDate, "EEEE, MMMM d, yyyy")}
                  </p>
                )}
                {pickupTime && returnDate && returnTime && (
                  <p className="text-sm font-body text-info">
                    ⏰ Exact 24-hour rental period. Overdue penalty: ₱100 per hour
                  </p>
                )}
                {!pickupDate && (
                  <p className="text-sm font-body text-muted-foreground">
                    Select pickup date and time first. Minimum rental: 1 day.
                  </p>
                )}
              </div>
              
              {totalDays > 0 && (
                <div className="space-y-3">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-body text-muted-foreground">
                      Total rental period: <span className="text-label text-foreground">{totalDays} day{totalDays > 1 ? 's' : ''}</span>
                    </p>
                  </div>
                  
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="font-body text-sm text-foreground">
                          <span className="font-semibold">⚠️ Overdue Penalty:</span>
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          ₱100 per hour for late returns beyond your {totalDays}-day rental period
                        </p>
                        {pickupTime && returnTime && returnDate && (
                          <p className="font-body text-sm text-info font-semibold">
                            Return deadline: {format(returnDate, "MMM d, yyyy")} at {timeOptions.find(t => t.value === returnTime)?.label}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="font-heading">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-label">Special requests or notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests, preferred motorcycle condition, or additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="bg-input border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center font-heading text-warning">
                <AlertCircle className="w-5 h-5 mr-2" />
                Important Rental Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-body text-muted-foreground">
              <p>• Valid driver's license required (will be uploaded in next step)</p>
              <p>• Minimum age requirement: 18 years old</p>
              <p>• <span className="font-semibold text-foreground">Rental periods are in 24-hour increments</span> (e.g., pickup 10 AM = return 10 AM on return date)</p>
              <p>• Security deposit: 20% of rental amount (refunded after inspection)</p>
              <p>• Fuel should be returned at the same level</p>
              <p>• <span className="font-semibold text-foreground">Overdue penalty:</span> ₱100 per hour beyond your scheduled return date/time</p>
              <p>• Free cancellation up to 24 hours before pickup</p>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('details')}
              className="btn-hover px-6 py-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Details
            </Button>
            <Button
              onClick={() => setCurrentStep('documents')}
              disabled={!canProceedToDocuments}
              className="bg-primary hover:bg-primary-dark btn-hover px-6 py-6"
            >
              Continue to Documents
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </div>

        {/* Summary Section - 4 columns */}
        <div className="col-span-4 mobile:col-span-4">
          <Card className="card-hover sticky top-24">
            <CardHeader>
              <CardTitle className="font-heading">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={motorcycle.image}
                    alt={motorcycle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{motorcycle.name}</h3>
                  <p className="font-body text-muted-foreground">{motorcycle.type}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate per day</span>
                  <span className="text-foreground">₱{motorcycle.pricePerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days</span>
                  <span className="text-foreground">{totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₱{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security deposit (20%)</span>
                  <span className="text-foreground">₱{securityDeposit}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total Amount Due</span>
                  <span className="text-primary">₱{total}</span>
                </div>
                <p className="text-xs font-body text-muted-foreground italic">
                  * Security deposit refunded after inspection
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="container-custom">
      <div className="grid-12 gap-8">
        {/* Form Section - 8 columns */}
        <div className="col-span-8 mobile:col-span-4 space-y-6">
          {/* Document Verification Section */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center font-heading">
                <FileText className="w-5 h-5 mr-2" />
                Document Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.driver_license_url ? (
                <div className="border border-success/20 rounded-lg p-6 bg-success/5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">Driver's License</h3>
                        <p className="font-body text-muted-foreground text-sm">Uploaded to your profile</p>
                      </div>
                    </div>
                    <Badge className="bg-success text-success-foreground">Verified</Badge>
                  </div>
                  
                  {/* Image Preview */}
                  <div className="w-full rounded-lg overflow-hidden border border-border bg-background">
                    <img 
                      src={user.driver_license_url} 
                      alt="Driver's License"
                      className="w-full h-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(user.driver_license_url, '_blank', 'noopener,noreferrer');
                      }}
                      onError={(e) => {
                        console.error('Failed to load license image:', user.driver_license_url);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="p-8 text-center text-muted-foreground"><p>Preview not available. Click below to view the document.</p></div>';
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(user.driver_license_url, '_blank', 'noopener,noreferrer');
                      }}
                      type="button"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-warning/20 rounded-lg p-6 bg-warning/5">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-warning mt-1" />
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-foreground mb-2">Driver's License Required</h3>
                      <p className="font-body text-muted-foreground text-sm mb-4">
                        Please upload your driver's license to your profile before making a reservation.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => navigate('profile')}
                      >
                        Go to Profile to Upload
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                <p className="font-body text-sm text-muted-foreground">
                  <strong className="text-foreground">💡 Tip:</strong> Your driver's license will be verified by our admin team during the reservation approval process.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('details')}
              className="btn-hover px-6 py-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schedule
            </Button>
            <Button
              onClick={() => setCurrentStep('payment')}
              disabled={!canProceedToPayment}
              className="bg-primary hover:bg-primary-dark btn-hover px-6 py-6"
            >
              Continue to Payment
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </div>

        {/* Summary Section - 4 columns */}
        <div className="col-span-4 mobile:col-span-4">
          <Card className="card-hover sticky top-24">
            <CardHeader>
              <CardTitle className="font-heading">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={motorcycle.image}
                    alt={motorcycle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{motorcycle.name}</h3>
                  <p className="font-body text-muted-foreground">{motorcycle.type}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup Date</span>
                  <span className="text-foreground">{pickupDate ? format(pickupDate, "PPP") : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Return Date</span>
                  <span className="text-foreground">{returnDate ? format(returnDate, "PPP") : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup Time</span>
                  <span className="text-foreground">{pickupTime || 'Not selected'}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate per day</span>
                  <span className="text-foreground">₱{motorcycle.pricePerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days</span>
                  <span className="text-foreground">{totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₱{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security deposit (20%)</span>
                  <span className="text-foreground">₱{securityDeposit}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total Amount Due</span>
                  <span className="text-primary">₱{total}</span>
                </div>
                <p className="text-xs font-body text-muted-foreground italic">
                  * Security deposit refunded after inspection
                </p>
              </div>

              {/* Document Status */}
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-foreground">Document Status</h4>
                <div className="flex items-center justify-between">
                  <span className="font-body text-muted-foreground text-sm">Driver's License</span>
                  {user?.driver_license_url ? (
                    <Badge className="bg-success text-success-foreground">Uploaded</Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning">Not Uploaded</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="container-custom pb-12">
      <div className="grid-12 gap-8">
        {/* Form Section - 8 columns */}
        <div className="col-span-8 mobile:col-span-4 space-y-6">
          {/* Payment Method Selection */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center font-heading">
                <CreditCard className="w-5 h-5 mr-2" />
                Select Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cash Payment Option */}
              <div
                onClick={() => setPaymentMethod('cash')}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <span className="text-2xl">💵</span>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">Cash Payment</h3>
                      <p className="font-body text-sm text-muted-foreground">
                        Pay at pickup location
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'cash' && (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
                {paymentMethod === 'cash' && (
                  <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                    <p className="font-body text-sm text-muted-foreground">
                      You will pay <span className="font-semibold text-foreground">₱{total}</span> when you arrive at the shop for pickup.
                      Please bring exact change if possible.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Important Payment Notes */}
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center font-heading text-warning">
                <AlertCircle className="w-5 h-5 mr-2" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-body text-muted-foreground">
              <p>• <span className="font-semibold text-foreground">Cash payments:</span> Full payment due at pickup location</p>
              <p>• Security deposit (₱{securityDeposit}) is refundable after motorcycle return and inspection</p>
              <p>• Your reservation is confirmed once payment is processed</p>
              <p>• Keep your payment receipt for verification</p>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('documents')}
              className="btn-hover px-6 py-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
            <Button
              onClick={() => setCurrentStep('confirmation')}
              disabled={!canProceedToConfirmation}
              className="bg-primary hover:bg-primary-dark btn-hover px-6 py-6"
            >
              Confirm Reservation
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </div>

        {/* Summary Section - 4 columns */}
        <div className="col-span-4 mobile:col-span-4">
          <Card className="card-hover sticky top-24">
            <CardHeader>
              <CardTitle className="font-heading">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={motorcycle.image}
                    alt={motorcycle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{motorcycle.name}</h3>
                  <p className="font-body text-muted-foreground">{motorcycle.type}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate per day</span>
                  <span className="text-foreground">₱{motorcycle.pricePerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days</span>
                  <span className="text-foreground">{totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₱{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security deposit (20%)</span>
                  <span className="text-foreground">₱{securityDeposit}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total Amount Due</span>
                  <span className="text-primary">₱{total}</span>
                </div>
                <p className="text-xs font-body text-muted-foreground italic">
                  * Security deposit refunded after inspection
                </p>
              </div>

              {paymentMethod && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-heading font-semibold text-foreground mb-2">Payment Method</h4>
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="font-body text-foreground">
                        💵 Cash Payment
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="container-custom">
      <div className="grid-12 gap-8">
        {/* Confirmation Section - 8 columns */}
        <div className="col-span-8 mobile:col-span-4 space-y-6">
          {/* Success Message */}
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-success-foreground" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground">Reservation Submitted!</h2>
                  <p className="font-body text-muted-foreground mt-2">
                    Your booking request has been received and is pending verification by our team.
                  </p>
                </div>
                {referenceNumber && (
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <p className="font-body text-muted-foreground text-sm">Reference Number</p>
                    <p className="font-heading text-xl font-bold text-primary">{referenceNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="font-heading">Reservation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-heading font-semibold text-foreground">Motorcycle</h4>
                  <p className="font-body text-muted-foreground">{motorcycle.name}</p>
                  <p className="font-body text-muted-foreground text-sm">{motorcycle.type}</p>
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-foreground">Total Amount</h4>
                  <p className="font-body text-primary text-xl font-bold">₱{total}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-heading font-semibold text-foreground">Pickup Date & Time</h4>
                  <p className="font-body text-muted-foreground">
                    {pickupDate ? format(pickupDate, "PPPP") : 'Not selected'}
                  </p>
                  <p className="font-body text-muted-foreground text-sm">
                    {pickupTime || 'Time not selected'}
                  </p>
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-foreground">Return Date & Time</h4>
                  <p className="font-body text-muted-foreground">
                    {returnDate ? format(returnDate, "PPPP") : 'Not selected'}
                  </p>
                  <p className="font-body text-muted-foreground text-sm">
                    {returnTime ? `By ${timeOptions.find(t => t.value === returnTime)?.label}` : 'Time not selected'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-heading font-semibold text-foreground">Pickup Location</h4>
                <p className="font-body text-muted-foreground">Dumaguete Moto Shop</p>
                <p className="font-body text-muted-foreground text-sm">123 Rizal Boulevard, Dumaguete City</p>
                <p className="font-body text-muted-foreground text-sm">📞 +63 935 123 4567</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-heading font-semibold text-foreground">Payment Method</h4>
                <div className="mt-2 p-3 bg-secondary rounded-lg">
                  <p className="font-body text-foreground">
                    💵 Cash Payment
                  </p>
                </div>
                <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="font-body text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">⚠️ Payment due at pickup:</span> Please bring ₱{total} when you arrive to collect your motorcycle.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-info/20 bg-info/5">
            <CardHeader>
              <CardTitle className="flex items-center font-heading text-info">
                <AlertCircle className="w-5 h-5 mr-2" />
                What happens next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-body text-muted-foreground">
              <p>• <span className="font-semibold text-foreground">Admin will review your reservation</span> and verify payment details</p>
              <p>• You will receive a confirmation email once your booking is approved</p>
              <p>• After approval, arrive at the pickup location 15 minutes before your scheduled time</p>
              <p>• Bring your verified documents and the full payment amount</p>
              <p>• <span className="font-semibold text-foreground">Pay ₱{total} at the shop</span> before picking up your motorcycle</p>
              <p>• Complete the final inspection before departure</p>
              <p>• <span className="font-semibold text-foreground">Return by scheduled date/time</span> ({totalDays}-day rental) to avoid ₱100/hour penalty</p>
              <p>• Enjoy your ride safely!</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate('home')}
              className="bg-primary hover:bg-primary-dark btn-hover flex-1 py-6"
            >
              Return to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('reservations')}
              className="btn-hover flex-1 py-6"
            >
              View My Reservations
            </Button>
          </div>
        </div>

        {/* Summary Section - 4 columns */}
        <div className="col-span-4 mobile:col-span-4">
          <Card className="card-hover sticky top-24">
            <CardHeader>
              <CardTitle className="font-heading">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={motorcycle.image}
                    alt={motorcycle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{motorcycle.name}</h3>
                  <p className="font-body text-muted-foreground">{motorcycle.type}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate per day</span>
                  <span className="text-foreground">₱{motorcycle.pricePerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days</span>
                  <span className="text-foreground">{totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₱{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security deposit (20%)</span>
                  <span className="text-foreground">₱{securityDeposit}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">₱{total}</span>
                </div>
              </div>

              {paymentMethod && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-heading font-semibold text-foreground mb-2">Payment</h4>
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="font-body text-foreground text-sm">
                        💵 Cash at pickup
                      </p>
                      <p className="font-body text-xs text-warning mt-1">
                        Payment pending
                      </p>
                    </div>
                  </div>
                </>
              )}

              {referenceNumber && (
                <>
                  <Separator />
                  <div className="text-center">
                    <p className="font-body text-muted-foreground text-sm">Reference Number</p>
                    <p className="font-heading text-lg font-bold text-primary">{referenceNumber}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Generate reference number when entering confirmation step
  if (currentStep === 'confirmation' && !referenceNumber) {
    handleConfirmReservation();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Motorcycle Info Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('details')}
              className="btn-hover px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Motorcycle
            </Button>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-heading font-semibold text-foreground">{motorcycle.name}</p>
                <p className="font-body text-sm text-muted-foreground">₱{motorcycle.pricePerDay}/day</p>
              </div>
              <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary/20 shadow-md">
                <ImageWithFallback
                  src={motorcycle.image}
                  alt={motorcycle.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        {renderStepIndicator()}
        
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'documents' && renderDocumentsStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
      </div>
    </div>
  );
}