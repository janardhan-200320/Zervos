import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Star,
  Send,
  CheckCircle,
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function FeedbackForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Parse URL parameters
  const [urlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      appointmentId: params.get('appointmentId') || '',
      service: params.get('service') || '',
      attendee: params.get('attendee') || '',
      customer: params.get('customer') || '',
    };
  });

  // Form state
  const [formData, setFormData] = useState({
    customerName: urlParams.customer || '',
    customerEmail: '',
    customerPhone: '',
    service: urlParams.service || '',
    attendee: urlParams.attendee || '',
    rating: 0,
    comment: '',
    wouldRecommend: null as boolean | null,
  });

  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.rating) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating',
        variant: 'destructive',
      });
      return;
    }

    // Create feedback object
    const feedback = {
      id: `FB-${Date.now()}`,
      appointmentId: urlParams.appointmentId,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      service: formData.service,
      attendee: formData.attendee,
      rating: formData.rating,
      comment: formData.comment,
      wouldRecommend: formData.wouldRecommend,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };

    // Get existing feedback
    const existingFeedback = JSON.parse(
      localStorage.getItem('zervos_feedback') || '[]'
    );

    // Add new feedback
    const updatedFeedback = [feedback, ...existingFeedback];
    localStorage.setItem('zervos_feedback', JSON.stringify(updatedFeedback));

    // Trigger storage event for dashboard
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('feedback-submitted'));

    setIsSubmitted(true);

    toast({
      title: 'Thank you for your feedback!',
      description: 'Your review helps us improve our services',
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center shadow-2xl border-0">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-slate-900 mb-3"
            >
              Thank You!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 mb-6"
            >
              Your feedback has been submitted successfully. We appreciate you taking the time to share your experience!
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3"
            >
              <Button
                onClick={() => window.close()}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => setIsSubmitted(false)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Submit Another
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">We Value Your Feedback</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            How Was Your Experience?
          </h1>
          <p className="text-lg text-slate-600">
            Your feedback helps us serve you better
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 shadow-xl border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Your Information
                </h3>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      placeholder="Enter your name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                      placeholder="your.email@example.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Service Details
                </h3>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="service">Service Taken</Label>
                    <Input
                      id="service"
                      value={formData.service}
                      onChange={(e) =>
                        setFormData({ ...formData, service: e.target.value })
                      }
                      placeholder="e.g., Haircut, Massage, Consultation"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="attendee">Service Attendee / Staff Name</Label>
                    <Input
                      id="attendee"
                      value={formData.attendee}
                      onChange={(e) =>
                        setFormData({ ...formData, attendee: e.target.value })
                      }
                      placeholder="Who performed the service?"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  Your Rating <span className="text-red-500">*</span>
                </h3>

                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-12 w-12 transition-colors ${
                          star <= (hoveredStar || formData.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                {formData.rating > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-slate-600"
                  >
                    {formData.rating === 5 && '⭐ Excellent!'}
                    {formData.rating === 4 && '😊 Very Good!'}
                    {formData.rating === 3 && '👍 Good'}
                    {formData.rating === 2 && '😕 Could be better'}
                    {formData.rating === 1 && '😞 Needs improvement'}
                  </motion.p>
                )}
              </div>

              {/* Would Recommend */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  Would you recommend us?
                </h3>

                <div className="flex gap-4 justify-center">
                  <Button
                    type="button"
                    variant={formData.wouldRecommend === true ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, wouldRecommend: true })}
                    className={
                      formData.wouldRecommend === true
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                  >
                    👍 Yes
                  </Button>
                  <Button
                    type="button"
                    variant={formData.wouldRecommend === false ? 'default' : 'outline'}
                    onClick={() =>
                      setFormData({ ...formData, wouldRecommend: false })
                    }
                    className={
                      formData.wouldRecommend === false
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }
                  >
                    👎 No
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900">
                  Additional Comments
                </h3>

                <Textarea
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  placeholder="Tell us more about your experience..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg shadow-xl"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Submit Feedback
                </Button>
              </motion.div>
            </form>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-sm text-slate-500"
        >
          Your feedback is confidential and helps us improve our services
        </motion.p>
      </div>
    </div>
  );
}
