# FoodSewa Model Tests - Instructions

## Understanding Test Results

When you see test results like "6 failed, 51 failed, 145 passed":

- **FAILED**: Tests that didn't pass due to errors (code issues, missing dependencies, etc.)
- **PASSED**: Tests that executed successfully and met all expectations
- **Total**: 6 + 51 + 145 = 202 total tests

## Common Reasons for Test Failures

1. **MongoDB Connection Issues**: Tests need a MongoDB database to run
2. **Missing Dependencies**: Required packages not installed
3. **ES6 Module Issues**: Import/export syntax problems
4. **Schema Validation Errors**: Model validation rules not matching test expectations

## How to Run Tests

### Prerequisites
1. Install dependencies:
   ```bash
   bun install
   ```

2. **Option A**: Start local MongoDB (recommended)
   ```bash
   # Make sure MongoDB is running on localhost:27017
   mongod
   ```

3. **Option B**: Tests will automatically use in-memory database if MongoDB is not available

### Running Tests

```bash
# Run all tests
bun run test

# Run tests with coverage report
bun run test:coverage

# Run tests in watch mode (re-runs on file changes)
bun run test:watch

# Run specific model tests
bunx jest __tests__/models/User.test.js
```

## Test Structure

Each model has comprehensive tests covering:

- **Schema Validation**: Required fields, data types, constraints
- **Business Logic**: Custom methods, calculations, validations
- **Edge Cases**: Invalid data, boundary conditions
- **Relationships**: References to other models
- **Defaults**: Auto-generated fields and default values

## Fixing Test Failures

1. **Check Error Messages**: Read the specific error for each failed test
2. **Verify Model Schema**: Ensure your model matches the test expectations
3. **Check Dependencies**: Make sure all required packages are installed
4. **Database Connection**: Verify MongoDB is accessible

## Test Files Location

- Test files: `__tests__/models/`
- Test setup: `__tests__/setup.js`
- Jest config: `jest.config.js`
- Babel config: `.babelrc`

## Coverage Reports

After running `bun run test:coverage`, check the `coverage/` directory for detailed reports showing which parts of your code are tested.

## Need Help?

If tests are still failing:
1. Run tests with verbose output: `bunx jest --verbose`
2. Check individual test files for specific requirements
3. Ensure your model schemas match the test expectations
4. Verify all model methods and virtuals are implemented correctly