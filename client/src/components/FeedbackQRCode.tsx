import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { QrCode, Download, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface FeedbackQRCodeProps {
  appointmentId?: string;
  service?: string;
  attendee?: string;
  customer?: string;
  size?: number;
}

export default function FeedbackQRCode({
  appointmentId,
  service,
  attendee,
  customer,
  size = 200,
}: FeedbackQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Generate feedback URL
  const feedbackUrl = (() => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    
    if (appointmentId) params.append('appointmentId', appointmentId);
    if (service) params.append('service', service);
    if (attendee) params.append('attendee', attendee);
    if (customer) params.append('customer', customer);
    
    const queryString = params.toString();
    return `${baseUrl}/feedback${queryString ? `?${queryString}` : ''}`;
  })();

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        feedbackUrl,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [feedbackUrl, size]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedbackUrl);
    toast({
      title: 'Link Copied!',
      description: 'Feedback link copied to clipboard',
    });
  };

  const downloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `feedback-qr-${appointmentId || 'general'}.png`;
      link.href = url;
      link.click();
      
      toast({
        title: 'QR Code Downloaded',
        description: 'QR code saved as PNG image',
      });
    }
  };

  const openLink = () => {
    window.open(feedbackUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
        <canvas ref={canvasRef} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button
            onClick={downloadQR}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download QR
          </Button>
        </div>
        
        <Button
          onClick={openLink}
          variant="default"
          size="sm"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Feedback Form
        </Button>
      </div>

      <div className="text-xs text-slate-600 text-center bg-slate-50 p-2 rounded">
        <p className="font-mono break-all">{feedbackUrl}</p>
      </div>
    </div>
  );
}
