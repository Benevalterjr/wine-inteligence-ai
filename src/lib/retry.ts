
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const errorMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      
      // Check if it's a 429 error (Quota Exceeded)
      const isQuotaError = 
        errorMsg.includes('429') || 
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        (error?.status === 429) ||
        (error?.code === 429) ||
        (error?.error?.code === 429) ||
        (error?.error?.status === 'RESOURCE_EXHAUSTED') ||
        (error?.response?.status === 429);

      if (!isQuotaError) {
        // For other errors, we might not want to retry as aggressively or at all
        // but the instructions say "network issues, 4xx/5xx"
        // Let's retry on 5xx as well
        const isRetryable = 
          (error?.status >= 500) || 
          (error?.code >= 500) ||
          errorMsg.includes('500') ||
          errorMsg.includes('503') ||
          errorMsg.includes('ECONNRESET') ||
          errorMsg.includes('ETIMEDOUT');
          
        if (!isRetryable) throw error;
      }

      if (i === maxRetries - 1) break;

      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, i) + Math.random() * 1000;
      console.warn(`Retry attempt ${i + 1}/${maxRetries} after ${Math.round(delay)}ms due to:`, errorMsg.substring(0, 100));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
