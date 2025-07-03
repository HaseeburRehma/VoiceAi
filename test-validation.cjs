// Test validation without running the full server
const { z } = require('zod');

// Simulate the validation schema
const userValidationRules = {
  username: {
    min: 3,
    max: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  password: {
    min: 8,
    max: 128,
  },
  name: {
    min: 2,
    max: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },
};

// Create a basic validation schema similar to the one in the app
const testSignUpSchema = z.object({
  name: z.string()
    .min(userValidationRules.name.min, "Name must be at least 2 characters long")
    .max(userValidationRules.name.max, "Name cannot exceed 50 characters")
    .regex(userValidationRules.name.pattern, "Name can only contain letters and spaces"),
  username: z.string()
    .min(userValidationRules.username.min, "Username must be at least 3 characters long")
    .max(userValidationRules.username.max, "Username cannot exceed 20 characters")
    .regex(userValidationRules.username.pattern, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(userValidationRules.password.min, "Password must be at least 8 characters long")
    .max(userValidationRules.password.max, "Password cannot exceed 128 characters"),
  email: z.string()
    .email("Must be a valid email address")
    .nonempty("Email is required"),
});

console.log('=== Testing Signup Validation ===');

// Test cases
const testCases = [
  {
    name: "Valid User",
    data: {
      name: "John Doe",
      username: "johndoe123",
      password: "securePassword123",
      email: "john@example.com"
    }
  },
  {
    name: "Short Username",
    data: {
      name: "John Doe",
      username: "jo",
      password: "securePassword123",
      email: "john@example.com"
    }
  },
  {
    name: "Invalid Username Characters",
    data: {
      name: "John Doe",
      username: "john-doe!",
      password: "securePassword123",
      email: "john@example.com"
    }
  },
  {
    name: "Short Password",
    data: {
      name: "John Doe",
      username: "johndoe123",
      password: "short",
      email: "john@example.com"
    }
  },
  {
    name: "Invalid Email",
    data: {
      name: "John Doe",
      username: "johndoe123",
      password: "securePassword123",
      email: "invalid-email"
    }
  },
  {
    name: "Invalid Name Characters",
    data: {
      name: "John123",
      username: "johndoe123",
      password: "securePassword123",
      email: "john@example.com"
    }
  },
  {
    name: "Missing Field",
    data: {
      username: "johndoe123",
      password: "securePassword123",
      email: "john@example.com"
      // Missing name
    }
  },
  {
    name: "Empty Email",
    data: {
      name: "John Doe",
      username: "johndoe123",
      password: "securePassword123",
      email: ""
    }
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log('Data:', JSON.stringify(testCase.data, null, 2));
  
  try {
    const result = testSignUpSchema.parse(testCase.data);
    console.log('✅ Validation passed');
  } catch (error) {
    console.log('❌ Validation failed:');
    if (error.errors) {
      error.errors.forEach(err => {
        console.log(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.log('  -', error.message);
    }
  }
});

console.log('\n=== Testing Common Frontend Payloads ===');

// Test typical frontend payloads that might cause issues
const frontendPayloads = [
  {
    name: "Typical Form Data",
    data: {
      name: "Test User",
      username: "testuser123",
      password: "testpassword123",
      email: "test@example.com"
    }
  },
  {
    name: "Form with Extra Spaces",
    data: {
      name: " Test User ",
      username: " testuser123 ",
      password: "testpassword123",
      email: " test@example.com "
    }
  },
  {
    name: "Mixed Case Email",
    data: {
      name: "Test User",
      username: "testuser123",
      password: "testpassword123",
      email: "Test@Example.COM"
    }
  }
];

frontendPayloads.forEach((payload, index) => {
  console.log(`\n${index + 1}. Testing: ${payload.name}`);
  console.log('Data:', JSON.stringify(payload.data, null, 2));
  
  try {
    const result = testSignUpSchema.parse(payload.data);
    console.log('✅ Validation passed');
  } catch (error) {
    console.log('❌ Validation failed:');
    if (error.errors) {
      error.errors.forEach(err => {
        console.log(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.log('  -', error.message);
    }
  }
});

console.log('\n=== Validation Test Complete ===');
