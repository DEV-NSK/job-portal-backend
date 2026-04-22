const CodeQualityResult = require('../models/CodeQualityResult');

// Detect Big-O from code patterns (static analysis)
const detectComplexity = (code, language) => {
  const lines = code.split('\n');
  let loopDepth = 0;
  let maxLoopDepth = 0;
  let hasRecursion = false;

  // Count loop nesting depth
  for (const line of lines) {
    const trimmed = line.trim();
    if (/\b(for|while)\b/.test(trimmed)) loopDepth++;
    if (/\}/.test(trimmed) && loopDepth > 0) loopDepth--;
    maxLoopDepth = Math.max(maxLoopDepth, loopDepth);
  }

  // Check for recursion (function calls itself)
  const fnMatch = code.match(/function\s+(\w+)/);
  if (fnMatch) {
    const fnName = fnMatch[1];
    const bodyAfterDef = code.slice(code.indexOf(fnMatch[0]) + fnMatch[0].length);
    if (bodyAfterDef.includes(fnName + '(')) hasRecursion = true;
  }

  let timeComplexity, optimalComplexity;
  if (maxLoopDepth >= 3) { timeComplexity = 'O(n³)'; optimalComplexity = 'O(n²)'; }
  else if (maxLoopDepth === 2) { timeComplexity = 'O(n²)'; optimalComplexity = 'O(n)'; }
  else if (hasRecursion) { timeComplexity = 'O(n log n)'; optimalComplexity = 'O(n log n)'; }
  else if (maxLoopDepth === 1) { timeComplexity = 'O(n)'; optimalComplexity = 'O(n)'; }
  else { timeComplexity = 'O(1)'; optimalComplexity = 'O(1)'; }

  // Space complexity
  const hasArray = /\[\]|new Array|new Set|new Map/.test(code);
  const spaceComplexity = hasArray ? 'O(n)' : 'O(1)';

  return { timeComplexity, spaceComplexity, optimalComplexity };
};

// Compute readability score
const computeReadability = (code) => {
  const lines = code.split('\n').filter(l => l.trim());
  const totalLines = lines.length;

  // Naming: check for single-letter variables (bad)
  const singleLetterVars = (code.match(/\b(var|let|const)\s+[a-z]\b/g) || []).length;
  const namingScore = Math.max(20, 100 - singleLetterVars * 15);

  // Function length
  const fnLengthScore = totalLines <= 20 ? 100 : totalLines <= 40 ? 70 : 40;

  // Comments
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('*')).length;
  const commentScore = Math.min(100, (commentLines / Math.max(totalLines, 1)) * 300);

  // Nesting depth
  let maxNesting = 0, nesting = 0;
  for (const line of lines) {
    nesting += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    maxNesting = Math.max(maxNesting, nesting);
  }
  const nestingScore = maxNesting <= 2 ? 100 : maxNesting <= 4 ? 70 : 40;

  // Cyclomatic complexity (count decision points)
  const decisions = (code.match(/\b(if|else|for|while|case|catch|\?\s*:)/g) || []).length;
  const complexityScore = decisions <= 3 ? 100 : decisions <= 7 ? 70 : 40;

  const overall = Math.round((namingScore + fnLengthScore + commentScore + nestingScore + complexityScore) / 5);

  return {
    overall,
    dimensions: [
      { name: 'Naming', score: Math.round(namingScore) },
      { name: 'Fn Length', score: Math.round(fnLengthScore) },
      { name: 'Comments', score: Math.round(commentScore) },
      { name: 'Nesting', score: Math.round(nestingScore) },
      { name: 'Complexity', score: Math.round(complexityScore) }
    ]
  };
};

// Generate edge case suggestions
const generateEdgeCases = (code) => {
  const cases = [];
  if (!code.includes('null') && !code.includes('undefined') && !code.includes('?.')) {
    cases.push({ case: 'Null/undefined input', severity: 'warning', suggestion: 'Add null check: if (!input) return []' });
  }
  if (!code.includes('.length') || !code.includes('=== 0')) {
    cases.push({ case: 'Empty array/string input', severity: 'warning', suggestion: 'Handle empty input: if (!arr || arr.length === 0) return []' });
  }
  if (code.includes('parseInt') || code.includes('Number(')) {
    cases.push({ case: 'Non-numeric string input', severity: 'info', suggestion: 'Validate numeric input with isNaN() check' });
  }
  if (code.includes('arr[') || code.includes('nums[')) {
    cases.push({ case: 'Array index out of bounds', severity: 'info', suggestion: 'Verify array bounds before accessing indices' });
  }
  return cases;
};

// Generate line annotations
const generateAnnotations = (code, timeComplexity) => {
  const annotations = [];
  const lines = code.split('\n');

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    if (/for.*for/.test(line) || (line.includes('for') && lines.slice(i + 1, i + 10).some(l => l.includes('for')))) {
      if (timeComplexity === 'O(n²)' || timeComplexity === 'O(n³)') {
        annotations.push({ line: lineNum, message: `Nested loop detected — contributes to ${timeComplexity} time complexity. Consider using a hash map for O(n) solution.`, type: 'error' });
      }
    }
    if (line.includes('.includes(') && line.includes('for')) {
      annotations.push({ line: lineNum, message: 'Array.includes() inside a loop adds O(n) overhead per iteration. Use Set.has() for O(1) lookups.', type: 'warning' });
    }
    if (i === 0 && !code.includes('/**') && !code.includes('//')) {
      annotations.push({ line: 1, message: 'Missing function documentation. Add JSDoc comments to describe parameters and return type.', type: 'info' });
    }
  });

  return annotations.slice(0, 5);
};

// POST /api/code-quality/analyze
const analyze = async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const { timeComplexity, spaceComplexity, optimalComplexity } = detectComplexity(code, language);
    const { overall: readabilityScore, dimensions } = computeReadability(code);
    const edgeCases = generateEdgeCases(code);
    const annotations = generateAnnotations(code, timeComplexity);

    // Use OpenAI for better analysis if available
    let refactoredCode = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a code quality expert. Provide a refactored version of the code with better time complexity. Return only the code, no explanation.'
          }, {
            role: 'user',
            content: `Refactor this ${language} code for better performance:\n\n${code}`
          }],
          max_tokens: 300
        });
        refactoredCode = completion.choices[0].message.content;
      } catch (aiErr) {
        console.error('OpenAI code quality error:', aiErr.message);
      }
    }

    const result = await CodeQualityResult.create({
      user: req.user._id,
      code,
      language,
      timeComplexity,
      spaceComplexity,
      readabilityScore,
      readabilityDimensions: dimensions,
      edgeCases,
      annotations,
      optimalComplexity,
      refactoredCode
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/code-quality/history
const getHistory = async (req, res) => {
  try {
    const history = await CodeQualityResult.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(30)
      .select('readabilityScore timeComplexity language createdAt');
    const data = history.reverse().map((h, i) => ({
      submission: i + 1,
      score: h.readabilityScore,
      complexity: h.timeComplexity,
      date: h.createdAt
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { analyze, getHistory };
