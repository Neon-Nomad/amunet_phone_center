import { FastifyReply, FastifyRequest } from 'fastify';

export interface TenantContext {
  tenantId: string;
}

export const tenantHeader = 'x-tenant-id';

export class TenantMissingError extends Error {
  statusCode = 400;

  constructor() {
    super('Missing tenant identifier header or query parameter');
    this.name = 'TenantMissingError';
  }
}

export function assertTenant(request: FastifyRequest, reply: FastifyReply): TenantContext {
  const query = request.query as Record<string, string | undefined>;
  const tenantIdHeader = request.headers[tenantHeader] as string | undefined;
  const tenantIdQuery = query?.tenantId;
  const tenantId = tenantIdHeader ?? tenantIdQuery;

  if (!tenantId) {
    throw new TenantMissingError();
  }

  return { tenantId };
}
