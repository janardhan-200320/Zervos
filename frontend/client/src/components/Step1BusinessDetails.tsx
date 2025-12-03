import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Upload, X, Building2 } from 'lucide-react';

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export default function Step1BusinessDetails() {
  const { data, updateData, nextStep } = useOnboarding();
  const [businessName, setBusinessName] = useState(data.businessName);
  const [businessLogo, setBusinessLogo] = useState(data.businessLogo);
  const [location, setLocation] = useState(data.location);
  const [description, setDescription] = useState(data.description);
  const [websiteUrl, setWebsiteUrl] = useState(data.websiteUrl);
  const [currency, setCurrency] = useState(data.currency);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.match(/^https?:\/\/.+\..+/) !== null;
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setBusinessLogo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormValid = businessName.trim() !== '' && isValidUrl(websiteUrl) && currency !== '';

  const handleNext = () => {
    updateData({ businessName, businessLogo, location, description, websiteUrl, currency });
    
    // Save business details to localStorage immediately for persistence
    try {
      // Update organization profile
      const existingOrg = localStorage.getItem('zervos_organization');
      const orgProfile = existingOrg ? JSON.parse(existingOrg) : {};
      const updatedOrg = {
        ...orgProfile,
        businessName: businessName.trim(),
        name: businessName.trim(),
        logo: businessLogo || '',
        tagline: description || '',
        description: description || '',
        website: websiteUrl || '',
        address: location || '',
        location: location || '',
        currency: currency || 'INR',
      };
      localStorage.setItem('zervos_organization', JSON.stringify(updatedOrg));
      
      // Update company profile
      const existingCompany = localStorage.getItem('zervos_company');
      const companyProfile = existingCompany ? JSON.parse(existingCompany) : {};
      const updatedCompany = {
        ...companyProfile,
        name: businessName.trim(),
        businessName: businessName.trim(),
        logo: businessLogo || '',
        location: location || '',
        description: description || '',
        website: websiteUrl || '',
        currency: currency || 'INR',
      };
      localStorage.setItem('zervos_company', JSON.stringify(updatedCompany));
      
      // Update booking page settings
      const existingBooking = localStorage.getItem('zervos_booking_page');
      const bookingSettings = existingBooking ? JSON.parse(existingBooking) : {};
      const updatedBooking = {
        ...bookingSettings,
        businessName: businessName.trim(),
        logo: businessLogo || '',
        tagline: description || '',
        welcomeMessage: `Welcome to ${businessName.trim()}! Book your appointment with us.`,
        website: websiteUrl || '',
        address: location || '',
      };
      localStorage.setItem('zervos_booking_page', JSON.stringify(updatedBooking));
    } catch (e) {
      console.error('Error saving business details to localStorage:', e);
    }
    
    nextStep();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg text-muted-foreground mb-2">
          Welcome to Zervos Bookings, Bharath Reddy!
        </h2>
        <h1 className="text-3xl font-semibold text-foreground">Let's get you meeting ready!</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm font-medium">
            Business name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder="Enter Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            data-testid="input-business-name"
            className="h-11"
          />
        </div>

        {/* Business Logo Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Business Logo</Label>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {businessLogo ? (
                <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                  <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    <X size={14} className="text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <Building2 size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <Upload size={16} className="mr-2" />
                Upload Logo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium">
            Business Location
          </Label>
          <Input
            id="location"
            placeholder="City, State, Country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Business Description
          </Label>
          <Textarea
            id="description"
            placeholder="Tell customers about your business..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm font-medium">
            Your business website
          </Label>
          <div className="flex gap-2">
            <div className="flex items-center px-3 bg-muted border border-input rounded-lg text-sm text-muted-foreground h-11">
              https://
            </div>
            <Input
              id="website"
              placeholder="sample.com"
              value={websiteUrl.replace(/^https?:\/\//, '')}
              onChange={(e) => {
                const value = e.target.value;
                setWebsiteUrl(value.startsWith('http') ? value : `https://${value}`);
              }}
              data-testid="input-website-url"
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency" className="text-sm font-medium">
            Currency {data.currency && `(${data.currency})`}
          </Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency" data-testid="select-currency" className="h-11">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          data-testid="button-next"
          className="min-w-32"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
