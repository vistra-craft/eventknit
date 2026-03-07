/**
 * Error Handling Utilities
 *
 * Standardized error extraction and handling for EventKnit.
 */

type ToastFn = (opts: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;

/**
 * Extracts a human-readable error message from an unknown error.
 *
 * Use this utility in catch blocks to safely extract error messages
 * without TypeScript complaints about unknown types.
 *
 * @param error - The caught error (can be anything)
 * @param fallback - Default message if extraction fails
 * @returns A string error message
 *
 * @example
 * try {
 *   await api.fetchData();
 * } catch (err) {
 *   setError(extractErrorMessage(err, 'Failed to fetch data'));
 * }
 */
export const extractErrorMessage = (
  error: unknown,
  fallback = 'An error occurred'
): string => {
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle API response errors
  if (error && typeof error === 'object' && 'error' in error) {
    const errorProp = (error as { error: unknown }).error;
    if (typeof errorProp === 'string') {
      return errorProp;
    }
  }

  return fallback;
};

/**
 * Type guard to check if an error has a message property
 */
export const hasMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
};

/**
 * Type guard to check if a response is an API error response
 */
export const isApiError = (
  response: unknown
): response is { success: false; message: string } => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as { success: unknown }).success === false &&
    'message' in response
  );
};

/**
 * Shows a destructive toast with a context-specific title.
 *
 * Replaces the broken pattern: `toast({ title: "Error", description: err instanceof Error ? err.message : 'fallback' })`
 *
 * @param toast   - The toast function from useToast()
 * @param error   - The caught error (any type)
 * @param title   - Context-specific title, e.g. "Save failed", "Upload failed"
 * @param fallback - Fallback message if error message cannot be extracted
 *
 * @example
 * } catch (err) {
 *   showErrorToast(toast, err, 'Save failed');
 * }
 */
export const showErrorToast = (
  toast: ToastFn,
  error: unknown,
  title: string,
  fallback = 'An error occurred'
): void => {
  toast({
    title,
    description: extractErrorMessage(error, fallback),
    variant: 'destructive',
  });
};

/**
 * Creates a standardized error handler for async operations
 *
 * @param setError - State setter for error message
 * @param setIsLoading - State setter for loading state
 * @param fallbackMessage - Default error message
 *
 * @example
 * const handleError = createErrorHandler(setError, setIsLoading, 'Operation failed');
 *
 * try {
 *   setIsLoading(true);
 *   await api.doSomething();
 * } catch (err) {
 *   handleError(err);
 * }
 */
export const createErrorHandler = (
  setError: (error: string | null) => void,
  setIsLoading?: (loading: boolean) => void,
  fallbackMessage = 'An error occurred'
) => {
  return (error: unknown) => {
    const message = extractErrorMessage(error, fallbackMessage);
    setError(message);
    setIsLoading?.(false);
  };
};
