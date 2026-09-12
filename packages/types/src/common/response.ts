export interface StandardResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
