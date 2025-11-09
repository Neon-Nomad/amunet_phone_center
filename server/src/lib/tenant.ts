import { FastifyReply, FastifyRequest } from 'fastify';

export interface TenantContext {
  tenantId: string;
}

export const tenantHeader = 'x-tenant-id';

export function assertTenant(request: FastifyRequest, reply: FastifyReply): TenantContext {
  const tenantId = request.headers[tenantHeader] as string | undefined;
  if (!tenantId) {
    void reply.code(400);
    throw new Error('Missing tenant identifier header');
  }

  return { tenantId };
}