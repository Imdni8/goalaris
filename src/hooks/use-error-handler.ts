import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/utils/api-error-handler';

/**
 * Hook for consistent error handling across the app
 */
export function useErrorHandler() {
  const { toast } = useToast();

  const showError = (error: unknown, customTitle?: string) => {
    const message = getUserFriendlyError(error);

    toast({
      variant: 'destructive',
      title: customTitle || 'Error',
      description: message,
    });
  };

  const showSuccess = (message: string, title?: string) => {
    toast({
      title: title || 'Success',
      description: message,
    });
  };

  return {
    showError,
    showSuccess,
  };
}
