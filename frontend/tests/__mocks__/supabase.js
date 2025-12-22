/**
 * Mock Supabase Client for Testing
 * Provides mock implementations of Supabase client methods
 */

// Mock session and user data
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000, // 1 hour from now
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
};

export const mockUser = {
  id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: 'https://i.pravatar.cc/150?img=1',
  timezone: 'America/New_York',
  google_calendar_connected: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

// Mock auth methods
const mockAuth = {
  signInWithPassword: jest.fn(({ email, password }) => {
    if (email === 'test@example.com' && password === 'correct-password') {
      return Promise.resolve({
        data: {
          session: mockSession,
          user: mockSession.user,
        },
        error: null,
      });
    }
    return Promise.resolve({
      data: { session: null, user: null },
      error: { message: 'Invalid email or password', status: 401 },
    });
  }),

  signUp: jest.fn(({ email, password, options }) => {
    if (email === 'existing@example.com') {
      return Promise.resolve({
        data: { session: null, user: null },
        error: { message: 'Email already exists', status: 409 },
      });
    }
    return Promise.resolve({
      data: {
        session: mockSession,
        user: {
          ...mockSession.user,
          email,
          user_metadata: options?.data || {},
        },
      },
      error: null,
    });
  }),

  signOut: jest.fn(() => {
    return Promise.resolve({
      error: null,
    });
  }),

  getSession: jest.fn(() => {
    return Promise.resolve({
      data: { session: mockSession },
      error: null,
    });
  }),

  getUser: jest.fn(() => {
    return Promise.resolve({
      data: { user: mockSession.user },
      error: null,
    });
  }),

  onAuthStateChange: jest.fn((callback) => {
    // Immediately call callback with initial state
    callback('SIGNED_IN', mockSession);

    // Return subscription object
    return {
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    };
  }),

  resetPasswordForEmail: jest.fn((email) => {
    return Promise.resolve({
      data: {},
      error: null,
    });
  }),

  updateUser: jest.fn((updates) => {
    return Promise.resolve({
      data: {
        user: {
          ...mockSession.user,
          ...updates,
        },
      },
      error: null,
    });
  }),
};

// Mock database query builder
class MockQueryBuilder {
  constructor(data = []) {
    this.data = data;
    this.filters = [];
    this.selectedFields = '*';
    this.sortField = null;
    this.sortOrder = 'asc';
    this.limitValue = null;
    this.offsetValue = null;
  }

  select(fields = '*') {
    this.selectedFields = fields;
    return this;
  }

  insert(values) {
    this.insertData = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values) {
    this.updateData = values;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(field, value) {
    this.filters.push({ type: 'eq', field, value });
    return this;
  }

  neq(field, value) {
    this.filters.push({ type: 'neq', field, value });
    return this;
  }

  gt(field, value) {
    this.filters.push({ type: 'gt', field, value });
    return this;
  }

  gte(field, value) {
    this.filters.push({ type: 'gte', field, value });
    return this;
  }

  lt(field, value) {
    this.filters.push({ type: 'lt', field, value });
    return this;
  }

  lte(field, value) {
    this.filters.push({ type: 'lte', field, value });
    return this;
  }

  in(field, values) {
    this.filters.push({ type: 'in', field, values });
    return this;
  }

  order(field, options = {}) {
    this.sortField = field;
    this.sortOrder = options.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  range(from, to) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  applyFilters(data) {
    return this.filters.reduce((filtered, filter) => {
      return filtered.filter((item) => {
        const fieldValue = item[filter.field];
        switch (filter.type) {
          case 'eq':
            return fieldValue === filter.value;
          case 'neq':
            return fieldValue !== filter.value;
          case 'gt':
            return fieldValue > filter.value;
          case 'gte':
            return fieldValue >= filter.value;
          case 'lt':
            return fieldValue < filter.value;
          case 'lte':
            return fieldValue <= filter.value;
          case 'in':
            return filter.values.includes(fieldValue);
          default:
            return true;
        }
      });
    }, data);
  }

  async execute() {
    let result = this.applyFilters(this.data);

    // Apply sorting
    if (this.sortField) {
      result.sort((a, b) => {
        const aVal = a[this.sortField];
        const bVal = b[this.sortField];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    if (this.offsetValue !== null) {
      result = result.slice(this.offsetValue);
    }
    if (this.limitValue !== null) {
      result = result.slice(0, this.limitValue);
    }

    // Handle single
    if (this.isSingle || this.isMaybeSingle) {
      if (result.length === 0) {
        return {
          data: this.isMaybeSingle ? null : undefined,
          error: this.isMaybeSingle ? null : { message: 'No rows found' },
        };
      }
      return { data: result[0], error: null };
    }

    return { data: result, error: null };
  }
}

// Mock from() method
const mockFrom = jest.fn((table) => {
  // Return empty data by default - tests can override this
  return new MockQueryBuilder([]);
});

// Mock realtime channel
const createMockChannel = (channelName) => {
  const listeners = {};

  return {
    on: jest.fn((event, filter, callback) => {
      const key = `${event}:${JSON.stringify(filter)}`;
      listeners[key] = callback;
      return mockChannel;
    }),

    subscribe: jest.fn((callback) => {
      if (callback) {
        callback('SUBSCRIBED');
      }
      return mockChannel;
    }),

    unsubscribe: jest.fn(() => {
      return Promise.resolve({ error: null });
    }),

    // Helper to trigger events in tests
    _trigger: (event, filter, payload) => {
      const key = `${event}:${JSON.stringify(filter)}`;
      if (listeners[key]) {
        listeners[key](payload);
      }
    },
  };
};

const mockChannel = createMockChannel('default');

// Mock storage
const mockStorage = {
  from: jest.fn((bucket) => ({
    upload: jest.fn((path, file, options) => {
      return Promise.resolve({
        data: {
          path,
          id: `file-${Date.now()}`,
          fullPath: `${bucket}/${path}`,
        },
        error: null,
      });
    }),

    download: jest.fn((path) => {
      return Promise.resolve({
        data: new Blob(['mock file content']),
        error: null,
      });
    }),

    remove: jest.fn((paths) => {
      return Promise.resolve({
        data: paths,
        error: null,
      });
    }),

    getPublicUrl: jest.fn((path) => {
      return {
        data: {
          publicUrl: `https://mock-storage.supabase.co/storage/v1/object/public/${bucket}/${path}`,
        },
      };
    }),

    createSignedUrl: jest.fn((path, expiresIn) => {
      return Promise.resolve({
        data: {
          signedUrl: `https://mock-storage.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=mock-token`,
        },
        error: null,
      });
    }),
  })),
};

// Mock Supabase client
export const mockSupabaseClient = {
  auth: mockAuth,
  from: mockFrom,
  channel: jest.fn((channelName) => createMockChannel(channelName)),
  removeChannel: jest.fn(() => Promise.resolve({ error: null })),
  removeAllChannels: jest.fn(() => Promise.resolve({ error: null })),
  storage: mockStorage,
};

// Mock createClient function
export const createClient = jest.fn((supabaseUrl, supabaseKey, options) => {
  return mockSupabaseClient;
});

// Default export
export default {
  createClient,
  mockSupabaseClient,
  mockAuth,
  mockSession,
  mockUser,
  createMockChannel,
  MockQueryBuilder,
};
