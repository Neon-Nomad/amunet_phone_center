import { vi } from 'vitest';

import { PrismaClient } from '@prisma/client';

type ModelName =
  | 'tenant'
  | 'user'
  | 'subscription'
  | 'businessConfig'
  | 'call'
  | 'message'
  | 'booking'
  | 'auditLog';

type Store = Record<ModelName, any[]>;

type WhereInput = Record<string, any> | undefined;

type OrderByInput = Record<string, 'asc' | 'desc'> | undefined;

function matchesWhere(record: Record<string, any>, where?: WhereInput): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (value && typeof value === 'object' && !Array.isArray(value) && 'equals' in value) {
      return record[key] === value.equals;
    }
    return record[key] === value;
  });
}

function sortRecords(records: any[], orderBy?: OrderByInput) {
  if (!orderBy) return records;
  const [[key, direction]] = Object.entries(orderBy);
  return [...records].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    if (aValue === bValue) return 0;
    const modifier = direction === 'desc' ? -1 : 1;
    return aValue > bValue ? modifier : -modifier;
  });
}

function generateId(prefix: string, existing: any[]) {
  return `${prefix}_${existing.length + 1}`;
}

function now() {
  return new Date();
}

export function createMockPrisma() {
  const store: Store = {
    tenant: [],
    user: [],
    subscription: [],
    businessConfig: [],
    call: [],
    message: [],
    booking: [],
    auditLog: []
  };

  const makeCreate = (model: ModelName) =>
    vi.fn(async ({ data }: { data: Record<string, any> }) => {
      const record = {
        id: data.id ?? generateId(model, store[model]),
        ...data,
        createdAt: data.createdAt ?? now(),
        updatedAt: data.updatedAt ?? now()
      };
      store[model].push(record);
      return record;
    });

  const makeFindMany = (model: ModelName) =>
    vi.fn(async ({ where, orderBy, take }: { where?: WhereInput; orderBy?: OrderByInput; take?: number } = {}) => {
      const filtered = store[model].filter((record) => matchesWhere(record, where));
      const sorted = sortRecords(filtered, orderBy);
      return typeof take === 'number' ? sorted.slice(0, take) : sorted;
    });

  const makeFindFirst = (model: ModelName) =>
    vi.fn(async ({ where }: { where?: WhereInput } = {}) => {
      return store[model].find((record) => matchesWhere(record, where)) ?? null;
    });

  const makeFindUnique = (model: ModelName) =>
    vi.fn(async ({ where }: { where: Record<string, any> }) => {
      const key = Object.keys(where)[0];
      return store[model].find((record) => record[key] === where[key]) ?? null;
    });

  const makeUpdateMany = (model: ModelName) =>
    vi.fn(async ({ where, data }: { where?: WhereInput; data: Record<string, any> }) => {
      let count = 0;
      for (const record of store[model]) {
        if (matchesWhere(record, where)) {
          Object.assign(record, data, { updatedAt: now() });
          count++;
        }
      }
      return { count };
    });

  const makeUpdate = (model: ModelName) =>
    vi.fn(async ({ where, data }: { where: Record<string, any>; data: Record<string, any> }) => {
      const key = Object.keys(where)[0];
      const record = store[model].find((item) => item[key] === where[key]);
      if (!record) {
        throw new Error(`Record not found for ${model}`);
      }
      Object.assign(record, data, { updatedAt: now() });
      return record;
    });

  const client: unknown = {
    tenant: {
      create: makeCreate('tenant'),
      findMany: makeFindMany('tenant')
    },
    user: {
      create: makeCreate('user'),
      findUnique: makeFindUnique('user')
    },
    subscription: {
      create: makeCreate('subscription'),
      findFirst: makeFindFirst('subscription'),
      update: makeUpdate('subscription')
    },
    businessConfig: {
      create: makeCreate('businessConfig'),
      findFirst: makeFindFirst('businessConfig'),
      updateMany: makeUpdateMany('businessConfig')
    },
    call: {
      create: makeCreate('call'),
      findMany: makeFindMany('call'),
      findFirst: makeFindFirst('call'),
      update: makeUpdate('call')
    },
    message: {
      create: makeCreate('message')
    },
    booking: {
      create: makeCreate('booking'),
      findMany: makeFindMany('booking')
    },
    auditLog: {
      create: makeCreate('auditLog'),
      findMany: makeFindMany('auditLog')
    },
    $transaction: async (callback: (tx: PrismaClient) => Promise<any>) => {
      return callback(client as PrismaClient);
    }
  };

  return {
    client: client as unknown as PrismaClient,
    store
  };
}