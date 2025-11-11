export interface ApiError {
  error: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  tenantId: string;
}

export interface RegisterResponse {
  tenantId: string;
  userId: string;
}

