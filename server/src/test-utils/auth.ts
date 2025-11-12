import { FastifyInstance } from 'fastify';

export interface TestUser {
  userId: string;
  tenantId: string;
  email: string;
}

/**
 * Generate a JWT token for testing authenticated endpoints
 */
export function generateTestToken(app: FastifyInstance, user: TestUser): string {
  return app.jwt.sign(
    {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email
    },
    {
      expiresIn: '2h'
    }
  );
}

/**
 * Create a test user with all required fields
 */
export function createTestUser(tenantId: string, userId?: string, email?: string): TestUser {
  return {
    userId: userId ?? `user_${tenantId}`,
    tenantId,
    email: email ?? `user@${tenantId}.test`
  };
}
