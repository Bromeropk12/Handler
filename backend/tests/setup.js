// Configuración global para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock de base de datos global
jest.mock('../src/services/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
    rollback: jest.fn(),
    commit: jest.fn()
  }))
}));

// Mock de middleware de auth global
jest.mock('../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: '550e8400-e29b-41d4-a716-446655440010', username: 'admin', role: 'admin' };
    next();
  }),
  authorize: jest.fn(() => (req, res, next) => next())
}));

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});