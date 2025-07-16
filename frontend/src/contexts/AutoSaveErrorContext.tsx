'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AutoSaveErrorHandler, { AutoSaveError, classifyError } from '@/components/AutoSaveErrorHandler';

interface AutoSaveErrorContextType {
  currentError: AutoSaveError | null;
  showError: (error: Error | AutoSaveError, retryCount?: number) => void;
  hideError: () => void;
  retryCurrentError: () => void;
  setRetryHandler: (handler: (() => void) | null) => void;
}

const AutoSaveErrorContext = createContext<AutoSaveErrorContextType | undefined>(undefined);

interface AutoSaveErrorProviderProps {
  children: React.ReactNode;
}

export function AutoSaveErrorProvider({ children }: AutoSaveErrorProviderProps) {
  const [currentError, setCurrentError] = useState<AutoSaveError | null>(null);
  const [retryHandler, setRetryHandler] = useState<(() => void) | null>(null);

  const showError = useCallback((error: Error | AutoSaveError, retryCount: number = 0) => {
    let autosaveError: AutoSaveError;
    
    if ('type' in error) {
      // Already an AutoSaveError
      autosaveError = error;
    } else {
      // Convert Error to AutoSaveError
      autosaveError = classifyError(error, retryCount);
    }
    
    setCurrentError(autosaveError);
  }, []);

  const hideError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const retryCurrentError = useCallback(() => {
    if (retryHandler) {
      retryHandler();
      hideError();
    }
  }, [retryHandler, hideError]);

  const setRetryHandlerCallback = useCallback((handler: (() => void) | null) => {
    setRetryHandler(() => handler);
  }, []);

  // Listen for draft management events
  useEffect(() => {
    const handleDraftManagement = () => {
      // This would open the draft management modal
      // You can implement this based on your existing modal system
      console.log('Opening draft management...');
    };

    window.addEventListener('open-draft-management', handleDraftManagement);
    return () => {
      window.removeEventListener('open-draft-management', handleDraftManagement);
    };
  }, []);

  const contextValue: AutoSaveErrorContextType = {
    currentError,
    showError,
    hideError,
    retryCurrentError,
    setRetryHandler: setRetryHandlerCallback,
  };

  return (
    <AutoSaveErrorContext.Provider value={contextValue}>
      {children}
      <AutoSaveErrorHandler
        error={currentError}
        onRetry={retryCurrentError}
        onDismiss={hideError}
      />
    </AutoSaveErrorContext.Provider>
  );
}

export function useAutoSaveError() {
  const context = useContext(AutoSaveErrorContext);
  if (context === undefined) {
    throw new Error('useAutoSaveError must be used within an AutoSaveErrorProvider');
  }
  return context;
}

// Helper hook for integrating with autosave operations
export function useAutoSaveErrorHandler() {
  const { showError, hideError, setRetryHandler } = useAutoSaveError();

  const handleError = useCallback((error: Error, retryCount: number = 0) => {
    console.error('AutoSave Error:', error);
    showError(error, retryCount);
  }, [showError]);

  const handleSuccess = useCallback(() => {
    hideError();
  }, [hideError]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    retryHandler?: () => void
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        if (retryHandler) {
          setRetryHandler(retryHandler);
        }
        const result = await operation(...args);
        handleSuccess();
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    };
  }, [handleError, handleSuccess, setRetryHandler]);

  return {
    handleError,
    handleSuccess,
    withErrorHandling,
  };
}