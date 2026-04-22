/**
 * Seed script — populates CodingProblems and Projects collections
 * Run: node scripts/seedFeatures.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const Project = require('../models/Project');
const User = require('../models/User');

const PROBLEMS = [
  {
    title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy', topic: 'Arrays', company: 'Google',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists'],
    starterCode: {
      javascript: 'var twoSum = function(nums, target) {\n    // Your solution here\n};\n',
      python: 'def twoSum(nums, target):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
      { input: '[3,3], 6', expectedOutput: '[0,1]' }
    ],
    optimalSolution: 'Use a hash map to store seen values. O(n) time, O(n) space.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)', xp: 10, tags: ['array', 'hash-table']
  },
  {
    title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'Easy', topic: 'Stack', company: 'Meta',
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only'],
    starterCode: {
      javascript: 'var isValid = function(s) {\n    // Your solution here\n};\n',
      python: 'def isValid(s):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: '"()"', expectedOutput: 'true' },
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' }
    ],
    optimalSolution: 'Use a stack. Push opening brackets, pop and match on closing brackets.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)', xp: 10, tags: ['stack', 'string']
  },
  {
    title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium', topic: 'Sliding Window', company: 'Amazon',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' }
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces'],
    starterCode: {
      javascript: 'var lengthOfLongestSubstring = function(s) {\n    // Your solution here\n};\n',
      python: 'def lengthOfLongestSubstring(s):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3' },
      { input: '"bbbbb"', expectedOutput: '1' },
      { input: '"pwwkew"', expectedOutput: '3' }
    ],
    optimalSolution: 'Sliding window with a hash set. O(n) time, O(min(m,n)) space.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)', xp: 25, tags: ['sliding-window', 'string', 'hash-table']
  },
  {
    title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'Medium', topic: 'Dynamic Programming', company: 'Microsoft',
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: {
      javascript: 'var maxSubArray = function(nums) {\n    // Your solution here\n};\n',
      python: 'def maxSubArray(nums):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' }
    ],
    optimalSolution: "Kadane's algorithm. O(n) time, O(1) space.",
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)', xp: 25, tags: ['dynamic-programming', 'array', 'divide-and-conquer']
  },
  {
    title: 'Merge Two Sorted Lists', slug: 'merge-two-sorted-lists', difficulty: 'Easy', topic: 'Linked List', company: 'Apple',
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
      { input: 'list1 = [], list2 = []', output: '[]' }
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50]', '-100 <= Node.val <= 100'],
    starterCode: {
      javascript: 'var mergeTwoLists = function(list1, list2) {\n    // Your solution here\n};\n',
      python: 'def mergeTwoLists(list1, list2):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: '[1,2,4], [1,3,4]', expectedOutput: '[1,1,2,3,4,4]' },
      { input: '[], []', expectedOutput: '[]' }
    ],
    optimalSolution: 'Iterative merge with a dummy head node. O(n+m) time, O(1) space.',
    timeComplexity: 'O(n+m)', spaceComplexity: 'O(1)', xp: 10, tags: ['linked-list', 'recursion']
  },
  {
    title: 'Binary Search', slug: 'binary-search', difficulty: 'Easy', topic: 'Binary Search', company: 'Google',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }
    ],
    constraints: ['1 <= nums.length <= 10^4', 'All integers in nums are unique', 'nums is sorted in ascending order'],
    starterCode: {
      javascript: 'var search = function(nums, target) {\n    // Your solution here\n};\n',
      python: 'def search(nums, target):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public int search(int[] nums, int target) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: '[-1,0,3,5,9,12], 9', expectedOutput: '4' },
      { input: '[-1,0,3,5,9,12], 2', expectedOutput: '-1' }
    ],
    optimalSolution: 'Classic binary search with left/right pointers. O(log n) time, O(1) space.',
    timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', xp: 10, tags: ['binary-search', 'array']
  },
  {
    title: 'Climbing Stairs', slug: 'climbing-stairs', difficulty: 'Easy', topic: 'Dynamic Programming', company: 'Amazon',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: '1. 1 step + 1 step\n2. 2 steps' },
      { input: 'n = 3', output: '3', explanation: '1. 1+1+1\n2. 1+2\n3. 2+1' }
    ],
    constraints: ['1 <= n <= 45'],
    starterCode: {
      javascript: 'var climbStairs = function(n) {\n    // Your solution here\n};\n',
      python: 'def climbStairs(n):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public int climbStairs(int n) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '5', expectedOutput: '8' }
    ],
    optimalSolution: 'Fibonacci sequence with DP. O(n) time, O(1) space.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)', xp: 10, tags: ['dynamic-programming', 'math', 'memoization']
  },
  {
    title: 'LRU Cache', slug: 'lru-cache', difficulty: 'Hard', topic: 'Design', company: 'Meta',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.',
    examples: [
      { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', output: '[null,null,null,1,null,-1,null,-1,3,4]' }
    ],
    constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5'],
    starterCode: {
      javascript: 'class LRUCache {\n    constructor(capacity) {\n        // Your solution here\n    }\n    get(key) {\n        // Your solution here\n    }\n    put(key, value) {\n        // Your solution here\n    }\n}\n',
      python: 'class LRUCache:\n    def __init__(self, capacity):\n        # Your solution here\n        pass\n    def get(self, key):\n        # Your solution here\n        pass\n    def put(self, key, value):\n        # Your solution here\n        pass\n',
      java: 'class LRUCache {\n    public LRUCache(int capacity) {\n        // Your solution here\n    }\n    public int get(int key) {\n        // Your solution here\n        return -1;\n    }\n    public void put(int key, int value) {\n        // Your solution here\n    }\n}\n',
      cpp: 'class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        // Your solution here\n    }\n    int get(int key) {\n        // Your solution here\n        return -1;\n    }\n    void put(int key, int value) {\n        // Your solution here\n    }\n};\n'
    },
    testCases: [
      { input: 'capacity=2, ops=[put(1,1),put(2,2),get(1),put(3,3),get(2),put(4,4),get(1),get(3),get(4)]', expectedOutput: '[1,-1,-1,3,4]' }
    ],
    optimalSolution: 'HashMap + Doubly Linked List. O(1) for both get and put.',
    timeComplexity: 'O(1)', spaceComplexity: 'O(capacity)', xp: 50, tags: ['hash-table', 'linked-list', 'design', 'doubly-linked-list']
  },
  {
    title: 'Word Search', slug: 'word-search', difficulty: 'Hard', topic: 'Backtracking', company: 'Microsoft',
    description: 'Given an m x n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.',
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true' },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: 'true' }
    ],
    constraints: ['m == board.length', 'n = board[i].length', '1 <= m, n <= 6', '1 <= word.length <= 15'],
    starterCode: {
      javascript: 'var exist = function(board, word) {\n    // Your solution here\n};\n',
      python: 'def exist(board, word):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public boolean exist(char[][] board, String word) {\n        // Your solution here\n        return false;\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        // Your solution here\n        return false;\n    }\n};\n'
    },
    testCases: [
      { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"', expectedOutput: 'true' },
      { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCB"', expectedOutput: 'false' }
    ],
    optimalSolution: 'DFS + Backtracking. Mark visited cells, restore on backtrack.',
    timeComplexity: 'O(m*n*4^L)', spaceComplexity: 'O(L)', xp: 50, tags: ['array', 'backtracking', 'matrix', 'dfs']
  },
  {
    title: 'Number of Islands', slug: 'number-of-islands', difficulty: 'Medium', topic: 'Graph', company: 'Amazon',
    description: 'Given an m x n 2D binary grid grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' }
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
    starterCode: {
      javascript: 'var numIslands = function(grid) {\n    // Your solution here\n};\n',
      python: 'def numIslands(grid):\n    # Your solution here\n    pass\n',
      java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        // Your solution here\n        return 0;\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Your solution here\n        return 0;\n    }\n};\n'
    },
    testCases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1' },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3' }
    ],
    optimalSolution: 'BFS/DFS flood fill. Mark visited cells as \'0\'. O(m*n) time and space.',
    timeComplexity: 'O(m*n)', spaceComplexity: 'O(m*n)', xp: 25, tags: ['array', 'dfs', 'bfs', 'union-find', 'matrix']
  }
];

const PROJECTS = [
  {
    title: 'Build a Real-Time Chat App',
    company: 'Stripe',
    companyLogo: '💳',
    domain: 'Frontend',
    difficulty: 'Medium',
    durationHours: 48,
    reward: '$50 Gift Card',
    techStack: ['React', 'WebSocket', 'Node.js'],
    description: 'Build a real-time chat application with rooms, typing indicators, and message history. Must support multiple concurrent users.',
    requirements: ['Real-time message delivery', 'Multiple chat rooms', 'Typing indicators', 'Message history persistence', 'User authentication'],
    isActive: true
  },
  {
    title: 'Design a REST API for E-Commerce',
    company: 'Shopify',
    companyLogo: '🛍️',
    domain: 'Backend',
    difficulty: 'Hard',
    durationHours: 72,
    reward: 'Fast Track Interview',
    techStack: ['Node.js', 'PostgreSQL', 'Redis'],
    description: 'Design and implement a scalable REST API for an e-commerce platform with cart, orders, and payments.',
    requirements: ['Product catalog CRUD', 'Shopping cart management', 'Order processing', 'Payment integration stub', 'Rate limiting'],
    isActive: true
  },
  {
    title: 'Data Visualization Dashboard',
    company: 'Tableau',
    companyLogo: '📊',
    domain: 'Frontend',
    difficulty: 'Easy',
    durationHours: 24,
    reward: '$25 Gift Card',
    techStack: ['React', 'D3.js', 'CSS'],
    description: 'Create an interactive data visualization dashboard with charts, filters, and export functionality.',
    requirements: ['At least 3 chart types', 'Interactive filters', 'CSV export', 'Responsive design', 'Dark mode support'],
    isActive: true
  },
  {
    title: 'Build a CLI Task Manager',
    company: 'Linear',
    companyLogo: '📋',
    domain: 'Backend',
    difficulty: 'Easy',
    durationHours: 24,
    reward: '$20 Gift Card',
    techStack: ['Node.js', 'SQLite'],
    description: 'Build a command-line task management tool with CRUD operations, priorities, and due dates.',
    requirements: ['Add/edit/delete tasks', 'Priority levels', 'Due date tracking', 'Filter and search', 'Persistent storage'],
    isActive: true
  },
  {
    title: 'Implement a URL Shortener',
    company: 'Bitly',
    companyLogo: '🔗',
    domain: 'Backend',
    difficulty: 'Medium',
    durationHours: 48,
    reward: 'Portfolio Feature',
    techStack: ['Node.js', 'Redis', 'MongoDB'],
    description: 'Build a URL shortener service with analytics, custom slugs, and expiration support.',
    requirements: ['URL shortening with custom slugs', 'Click analytics', 'Expiration dates', 'Rate limiting', 'API documentation'],
    isActive: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Seed coding problems
    const existingProblems = await CodingProblem.countDocuments();
    if (existingProblems === 0) {
      await CodingProblem.insertMany(PROBLEMS);
      console.log(`✅ Seeded ${PROBLEMS.length} coding problems`);
    } else {
      console.log(`ℹ️  Coding problems already seeded (${existingProblems} exist)`);
    }

    // Seed projects (need an employer user)
    const existingProjects = await Project.countDocuments();
    if (existingProjects === 0) {
      // Find or create a system employer
      let employer = await User.findOne({ role: 'employer' });
      if (!employer) {
        const bcrypt = require('bcryptjs');
        employer = await User.create({
          name: 'Platform Team',
          email: 'projects@platform.com',
          password: await bcrypt.hash('platform123', 10),
          role: 'employer'
        });
        console.log('✅ Created system employer user');
      }

      const projectsWithEmployer = PROJECTS.map(p => ({ ...p, employer: employer._id }));
      await Project.insertMany(projectsWithEmployer);
      console.log(`✅ Seeded ${PROJECTS.length} projects`);
    } else {
      console.log(`ℹ️  Projects already seeded (${existingProjects} exist)`);
    }

    console.log('✅ Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
