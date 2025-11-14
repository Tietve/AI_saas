/**
 * 10 Diverse Test Scenarios for Multi-Turn RAG
 */

export interface TestScenario {
  name: string;
  description: string;
  turns: string[];
  expectedBehavior: {
    turn1: string;
    turn2: string;
    turn3: string;
  };
}

export const TEST_SCENARIOS: TestScenario[] = [
  // Scenario 1: API Development (Technical)
  {
    name: '1. API Development Workflow',
    description: 'User building REST API step-by-step',
    turns: [
      'Tôi cần tạo REST API với Node.js và Express',
      'Làm sao thêm JWT authentication?',
      'Còn rate limiting để chống spam thì sao?',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (backend developer) + TASK (create API) + CONTEXT + FORMAT',
      turn2: 'Contextual: "Given your API setup, add JWT..." - NO role repetition',
      turn3: 'Contextual: "For your authenticated API, add rate limiting..." - Even more concise',
    },
  },

  // Scenario 2: Data Analysis (Analytical)
  {
    name: '2. Data Analysis Pipeline',
    description: 'User analyzing customer data',
    turns: [
      'Phân tích dataset về customer behavior với Python',
      'Làm sao tìm outliers trong data?',
      'Visualize kết quả bằng chart nào tốt nhất?',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (data analyst) + statistical methods + visualization',
      turn2: 'Contextual: "In your customer analysis, detect outliers using..."',
      turn3: 'Contextual: "To visualize the outlier analysis results..."',
    },
  },

  // Scenario 3: Frontend Development (UI/UX)
  {
    name: '3. React Dashboard Creation',
    description: 'Building responsive dashboard',
    turns: [
      'Tạo dashboard analytics với React',
      'Làm responsive design cho mobile',
      'Thêm dark mode toggle',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (frontend developer) + React patterns + component structure',
      turn2: 'Contextual: "Make your dashboard responsive..." - references existing work',
      turn3: 'Contextual: "Add dark mode to the responsive dashboard..."',
    },
  },

  // Scenario 4: Code Refactoring (Improvement)
  {
    name: '4. Code Optimization',
    description: 'Improving existing codebase',
    turns: [
      'Refactor code này để clean hơn',
      'Làm sao improve performance?',
      'Add unit tests',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (senior developer) + refactoring principles + clean code',
      turn2: 'Contextual: "After refactoring, optimize performance by..."',
      turn3: 'Contextual: "For the optimized code, write unit tests..."',
    },
  },

  // Scenario 5: Database Design (Architecture)
  {
    name: '5. Database Schema Design',
    description: 'Designing relational database',
    turns: [
      'Thiết kế database schema cho e-commerce',
      'Thêm indexes để optimize queries',
      'Handle transactions như thế nào?',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (database architect) + normalization + relationships',
      turn2: 'Contextual: "For the e-commerce schema, add indexes on..."',
      turn3: 'Contextual: "Implement transaction handling for..."',
    },
  },

  // Scenario 6: Machine Learning (ML/AI)
  {
    name: '6. ML Model Training',
    description: 'Training classification model',
    turns: [
      'Train model phân loại spam email',
      'Làm sao improve accuracy?',
      'Deploy model lên production',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (ML engineer) + classification algorithms + evaluation',
      turn2: 'Contextual: "To improve your spam classifier accuracy..."',
      turn3: 'Contextual: "Deploy the trained model using..."',
    },
  },

  // Scenario 7: DevOps/Deployment (Infrastructure)
  {
    name: '7. Docker Deployment',
    description: 'Containerizing application',
    turns: [
      'Dockerize ứng dụng Node.js',
      'Setup CI/CD với GitHub Actions',
      'Deploy lên AWS',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (DevOps engineer) + Docker best practices + multi-stage builds',
      turn2: 'Contextual: "For your Dockerized app, set up CI/CD..."',
      turn3: 'Contextual: "Deploy the containerized app to AWS using..."',
    },
  },

  // Scenario 8: Security Implementation (Security)
  {
    name: '8. Security Hardening',
    description: 'Adding security layers',
    turns: [
      'Implement security cho web app',
      'Protect against SQL injection',
      'Add CSRF protection',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (security engineer) + OWASP Top 10 + security patterns',
      turn2: 'Contextual: "In your secured app, prevent SQL injection by..."',
      turn3: 'Contextual: "Add CSRF protection using..."',
    },
  },

  // Scenario 9: Testing Strategy (QA)
  {
    name: '9. Test Automation',
    description: 'Setting up automated testing',
    turns: [
      'Setup testing framework cho React app',
      'Write integration tests',
      'Add E2E tests với Playwright',
    ],
    expectedBehavior: {
      turn1: 'Full prompt with ROLE (QA engineer) + testing pyramid + Jest/RTL setup',
      turn2: 'Contextual: "For your React test suite, add integration tests..."',
      turn3: 'Contextual: "Extend testing with E2E using Playwright..."',
    },
  },

  // Scenario 10: Topic Shift (Edge Case)
  {
    name: '10. Topic Shift Detection',
    description: 'User changes topic mid-conversation',
    turns: [
      'Tạo REST API với Express',
      'Thêm authentication',
      'Chủ đề mới: Làm machine learning model',
    ],
    expectedBehavior: {
      turn1: 'Full prompt for API development',
      turn2: 'Contextual enhancement for authentication',
      turn3: 'RESET: New full prompt for ML (topic shift detected)',
    },
  },
];

// Additional edge case scenarios
export const EDGE_CASE_SCENARIOS: TestScenario[] = [
  // Clarification questions
  {
    name: 'E1. Clarification Questions',
    description: 'User asks "what is X?" questions',
    turns: [
      'Tạo API',
      'JWT là gì?',
      'Làm sao implement JWT?',
    ],
    expectedBehavior: {
      turn1: 'Full prompt for API creation',
      turn2: 'Retrieve explanation knowledge (might need new docs)',
      turn3: 'Contextual: Now implement JWT in the API',
    },
  },

  // Very short messages
  {
    name: 'E2. Short Continuation',
    description: 'User sends very brief messages',
    turns: [
      'Tạo dashboard React',
      'Thêm charts',
      'Và dark mode',
    ],
    expectedBehavior: {
      turn1: 'Full prompt for dashboard',
      turn2: 'Contextual: Add charts to dashboard',
      turn3: 'Contextual: Also add dark mode',
    },
  },

  // Complex multi-part request
  {
    name: 'E3. Complex Multi-Part',
    description: 'User requests multiple things at once',
    turns: [
      'Tạo full-stack app với React + Node + PostgreSQL',
      'Thêm authentication, authorization, và rate limiting',
      'Setup Docker + CI/CD + deploy lên AWS',
    ],
    expectedBehavior: {
      turn1: 'Full comprehensive prompt covering all stack layers',
      turn2: 'Contextual: Add security layers (auth, authz, rate limit)',
      turn3: 'Contextual: DevOps setup for the secured full-stack app',
    },
  },
];

export const ALL_SCENARIOS = [...TEST_SCENARIOS, ...EDGE_CASE_SCENARIOS];

// Helper to print scenarios
export function printScenarios(): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 TEST SCENARIOS (${ALL_SCENARIOS.length} total)`);
  console.log(`${'='.repeat(80)}\n`);

  ALL_SCENARIOS.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Turns: ${scenario.turns.length}`);
    console.log(``);
  });
}
