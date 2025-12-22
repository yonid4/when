/**
 * Mock Axios for Testing
 * Provides mock implementations of axios HTTP methods and interceptors
 */

// Mock response data storage
const mockResponses = new Map();
const mockErrors = new Map();

// Helper to create axios response object
const createAxiosResponse = (data, status = 200, statusText = 'OK', headers = {}) => ({
  data,
  status,
  statusText,
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  config: {},
});

// Helper to create axios error object
const createAxiosError = (message, status = 500, response = null) => {
  const error = new Error(message);
  error.isAxiosError = true;
  error.response = response || {
    data: { error: message },
    status,
    statusText: status === 500 ? 'Internal Server Error' : 'Error',
    headers: {},
    config: {},
  };
  error.config = {};
  error.toJSON = () => ({
    message: error.message,
    name: error.name,
    stack: error.stack,
    config: error.config,
    code: error.code,
    status: error.response?.status,
  });
  return error;
};

// Request interceptor handlers
const requestInterceptors = {
  onFulfilled: [],
  onRejected: [],
};

// Response interceptor handlers
const responseInterceptors = {
  onFulfilled: [],
  onRejected: [],
};

// Apply request interceptors
const applyRequestInterceptors = async (config) => {
  let interceptedConfig = config;
  for (const handler of requestInterceptors.onFulfilled) {
    try {
      interceptedConfig = await handler(interceptedConfig);
    } catch (error) {
      for (const errorHandler of requestInterceptors.onRejected) {
        return await errorHandler(error);
      }
      throw error;
    }
  }
  return interceptedConfig;
};

// Apply response interceptors
const applyResponseInterceptors = async (response) => {
  let interceptedResponse = response;
  for (const handler of responseInterceptors.onFulfilled) {
    try {
      interceptedResponse = await handler(interceptedResponse);
    } catch (error) {
      for (const errorHandler of responseInterceptors.onRejected) {
        return await errorHandler(error);
      }
      throw error;
    }
  }
  return interceptedResponse;
};

// Apply error interceptors
const applyErrorInterceptors = async (error) => {
  for (const handler of responseInterceptors.onRejected) {
    try {
      return await handler(error);
    } catch (handlerError) {
      error = handlerError;
    }
  }
  throw error;
};

// Mock HTTP methods
const mockGet = jest.fn(async (url, config = {}) => {
  const interceptedConfig = await applyRequestInterceptors({ url, method: 'GET', ...config });

  // Check for error mock
  const errorKey = `GET:${url}`;
  if (mockErrors.has(errorKey)) {
    const error = mockErrors.get(errorKey);
    try {
      await applyErrorInterceptors(error);
    } catch (e) {
      throw e;
    }
  }

  // Check for response mock
  const responseKey = `GET:${url}`;
  if (mockResponses.has(responseKey)) {
    const mockData = mockResponses.get(responseKey);
    const response = createAxiosResponse(mockData);
    return await applyResponseInterceptors(response);
  }

  // Default empty response
  const response = createAxiosResponse({ data: [] });
  return await applyResponseInterceptors(response);
});

const mockPost = jest.fn(async (url, data, config = {}) => {
  const interceptedConfig = await applyRequestInterceptors({ url, method: 'POST', data, ...config });

  // Check for error mock
  const errorKey = `POST:${url}`;
  if (mockErrors.has(errorKey)) {
    const error = mockErrors.get(errorKey);
    try {
      await applyErrorInterceptors(error);
    } catch (e) {
      throw e;
    }
  }

  // Check for response mock
  const responseKey = `POST:${url}`;
  if (mockResponses.has(responseKey)) {
    const mockData = mockResponses.get(responseKey);
    const responseData = typeof mockData === 'function' ? mockData(data) : mockData;
    const response = createAxiosResponse(responseData, 201);
    return await applyResponseInterceptors(response);
  }

  // Default created response
  const response = createAxiosResponse({ success: true, data }, 201);
  return await applyResponseInterceptors(response);
});

const mockPut = jest.fn(async (url, data, config = {}) => {
  const interceptedConfig = await applyRequestInterceptors({ url, method: 'PUT', data, ...config });

  // Check for error mock
  const errorKey = `PUT:${url}`;
  if (mockErrors.has(errorKey)) {
    const error = mockErrors.get(errorKey);
    try {
      await applyErrorInterceptors(error);
    } catch (e) {
      throw e;
    }
  }

  // Check for response mock
  const responseKey = `PUT:${url}`;
  if (mockResponses.has(responseKey)) {
    const mockData = mockResponses.get(responseKey);
    const responseData = typeof mockData === 'function' ? mockData(data) : mockData;
    const response = createAxiosResponse(responseData);
    return await applyResponseInterceptors(response);
  }

  // Default success response
  const response = createAxiosResponse({ success: true, data });
  return await applyResponseInterceptors(response);
});

const mockPatch = jest.fn(async (url, data, config = {}) => {
  const interceptedConfig = await applyRequestInterceptors({ url, method: 'PATCH', data, ...config });

  // Check for error mock
  const errorKey = `PATCH:${url}`;
  if (mockErrors.has(errorKey)) {
    const error = mockErrors.get(errorKey);
    try {
      await applyErrorInterceptors(error);
    } catch (e) {
      throw e;
    }
  }

  // Check for response mock
  const responseKey = `PATCH:${url}`;
  if (mockResponses.has(responseKey)) {
    const mockData = mockResponses.get(responseKey);
    const responseData = typeof mockData === 'function' ? mockData(data) : mockData;
    const response = createAxiosResponse(responseData);
    return await applyResponseInterceptors(response);
  }

  // Default success response
  const response = createAxiosResponse({ success: true, data });
  return await applyResponseInterceptors(response);
});

const mockDelete = jest.fn(async (url, config = {}) => {
  const interceptedConfig = await applyRequestInterceptors({ url, method: 'DELETE', ...config });

  // Check for error mock
  const errorKey = `DELETE:${url}`;
  if (mockErrors.has(errorKey)) {
    const error = mockErrors.get(errorKey);
    try {
      await applyErrorInterceptors(error);
    } catch (e) {
      throw e;
    }
  }

  // Check for response mock
  const responseKey = `DELETE:${url}`;
  if (mockResponses.has(responseKey)) {
    const mockData = mockResponses.get(responseKey);
    const response = createAxiosResponse(mockData, 204);
    return await applyResponseInterceptors(response);
  }

  // Default no content response
  const response = createAxiosResponse(null, 204, 'No Content');
  return await applyResponseInterceptors(response);
});

const mockRequest = jest.fn(async (config) => {
  const method = (config.method || 'GET').toUpperCase();
  const url = config.url;

  const interceptedConfig = await applyRequestInterceptors(config);

  // Check for error mock
  const errorKey = `${method}:${url}`;
  if (mockErrors.has(errorKey)) {
    const error = mockErrors.get(errorKey);
    try {
      await applyErrorInterceptors(error);
    } catch (e) {
      throw e;
    }
  }

  // Check for response mock
  const responseKey = `${method}:${url}`;
  if (mockResponses.has(responseKey)) {
    const mockData = mockResponses.get(responseKey);
    const responseData = typeof mockData === 'function' ? mockData(config.data) : mockData;
    const response = createAxiosResponse(responseData);
    return await applyResponseInterceptors(response);
  }

  // Default response
  const response = createAxiosResponse({});
  return await applyResponseInterceptors(response);
});

// Mock interceptors
const mockInterceptors = {
  request: {
    use: jest.fn((onFulfilled, onRejected) => {
      if (onFulfilled) requestInterceptors.onFulfilled.push(onFulfilled);
      if (onRejected) requestInterceptors.onRejected.push(onRejected);
      return requestInterceptors.onFulfilled.length - 1;
    }),
    eject: jest.fn((id) => {
      requestInterceptors.onFulfilled.splice(id, 1);
    }),
    clear: jest.fn(() => {
      requestInterceptors.onFulfilled = [];
      requestInterceptors.onRejected = [];
    }),
  },
  response: {
    use: jest.fn((onFulfilled, onRejected) => {
      if (onFulfilled) responseInterceptors.onFulfilled.push(onFulfilled);
      if (onRejected) responseInterceptors.onRejected.push(onRejected);
      return responseInterceptors.onFulfilled.length - 1;
    }),
    eject: jest.fn((id) => {
      responseInterceptors.onFulfilled.splice(id, 1);
    }),
    clear: jest.fn(() => {
      responseInterceptors.onFulfilled = [];
      responseInterceptors.onRejected = [];
    }),
  },
};

// Mock create function for creating axios instances
const mockCreate = jest.fn((config = {}) => ({
  defaults: {
    baseURL: config.baseURL || '',
    headers: config.headers || {},
    timeout: config.timeout || 0,
    ...config,
  },
  interceptors: mockInterceptors,
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,
  delete: mockDelete,
  request: mockRequest,
}));

// Main axios mock
const axiosMock = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,
  delete: mockDelete,
  request: mockRequest,
  create: mockCreate,
  interceptors: mockInterceptors,
  defaults: {
    baseURL: '',
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      patch: {},
      delete: {},
    },
    timeout: 0,
  },
  isAxiosError: jest.fn((error) => error && error.isAxiosError === true),
  CancelToken: {
    source: jest.fn(() => ({
      token: {},
      cancel: jest.fn(),
    })),
  },
};

// Test helper functions
axiosMock.__setMockResponse = (method, url, data) => {
  mockResponses.set(`${method.toUpperCase()}:${url}`, data);
};

axiosMock.__setMockError = (method, url, error) => {
  const axiosError = typeof error === 'string'
    ? createAxiosError(error)
    : error;
  mockErrors.set(`${method.toUpperCase()}:${url}`, axiosError);
};

axiosMock.__clearMockResponses = () => {
  mockResponses.clear();
};

axiosMock.__clearMockErrors = () => {
  mockErrors.clear();
};

axiosMock.__reset = () => {
  mockResponses.clear();
  mockErrors.clear();
  requestInterceptors.onFulfilled = [];
  requestInterceptors.onRejected = [];
  responseInterceptors.onFulfilled = [];
  responseInterceptors.onRejected = [];
  mockGet.mockClear();
  mockPost.mockClear();
  mockPut.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
  mockRequest.mockClear();
  mockCreate.mockClear();
};

// Export mock
export default axiosMock;

// Named exports for convenience
export {
  mockGet as get,
  mockPost as post,
  mockPut as put,
  mockPatch as patch,
  mockDelete as delete_,
  mockRequest as request,
  mockCreate as create,
  mockInterceptors as interceptors,
  createAxiosResponse,
  createAxiosError,
};
