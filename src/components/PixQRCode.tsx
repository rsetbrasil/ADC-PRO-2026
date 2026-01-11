'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, QrCode } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface PixQRCodeProps {
  payload: string;
}

export default function PixQRCode({ payload }: PixQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (payload) {
      QRCode.toDataURL(payload, { width: 256, margin: 1 })
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(err => {
          console.error('Failed to generate QR Code', err);
        });
    }
  }, [payload]);

  const handleCopy = () => {
    navigator.clipboard.writeText(payload).then(() => {
      toast({
        title: 'Copiado!',
        description: 'O código PIX foi copiado para a área de transferência.',
      });
    });
  };

  if (!payload) return null;

  return (
    <div className="flex flex-col items-center gap-2 p-2 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 font-semibold text-sm">
            <QrCode className="h-4 w-4 text-primary"/>
            <span>Pague com PIX</span>
        </div>
      {qrCodeUrl ? (
        <img src={qrCodeUrl} alt="PIX QR Code" className="w-full h-auto rounded-md" />
      ) : (
        <Skeleton className="w-full aspect-square rounded-md" />
      )}
      <p className="text-xs text-muted-foreground text-center mt-1 print-hidden pdf-hidden">
        Abra o app do seu banco e aponte a câmera para o QR Code para pagar.
      </p>
    </div>
  );
}
