export interface AckResponse<T = any> {
    status: 'ok' | 'error';
    data?: T;
    error?: string;
  }