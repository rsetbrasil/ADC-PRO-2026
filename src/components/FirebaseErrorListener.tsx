

'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

export default function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // This will be caught by the Next.js error overlay
      throw error;
    };

    errorEmitter.on(handleError);

    return () => {
      errorEmitter.off(handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}
