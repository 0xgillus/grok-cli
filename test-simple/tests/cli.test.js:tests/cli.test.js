const { greet } = require('../src/index');

// Mock console.log to capture output
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('CLI Commands', () => {
  afterEach(() => {
    mockLog.mockClear();
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  test('greet with default name', () => {
    greet();
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Hello, World!'));
  });

  test('greet with specific name', () => {
    greet('John');
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Hello, John!'));
  });
});