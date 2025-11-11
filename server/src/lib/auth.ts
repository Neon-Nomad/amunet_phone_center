import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
}

export class UnauthorizedError extends Error {
  statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Verifies JWT token from Authorization header and extracts user information
 */
export async function verifyJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser> {
  try {
    // Verify and decode the JWT token
    // @fastify/jwt automatically verifies tokens from Authorization header
    const decoded = await request.jwtVerify<AuthUser>();

    // Ensure required fields are present
    if (!decoded.userId || !decoded.tenantId || !decoded.email) {
      throw new UnauthorizedError('Invalid token payload');
    }

    return decoded;
  } catch (error: any) {
    if (error.statusCode === 401 || error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID' || error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      throw new UnauthorizedError('Invalid or expired token');
    }
    throw error;
  }
}

/**
 * Middleware to require authentication on a route
 * Attaches user information to request object
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = await verifyJWT(request, reply);
  
  // Attach user to request for use in route handlers
  (request as any).user = user;
  
  // Also set tenant ID in headers for compatibility with existing code
  request.headers['x-tenant-id'] = user.tenantId;
}

/**
 * Helper to get authenticated user from request
 * Use this in route handlers after requireAuth middleware
 */
export function getAuthUser(request: FastifyRequest): AuthUser {
  const user = (request as any).user;
  if (!user) {
    throw new UnauthorizedError('User not authenticated');
  }
  return user;
}

