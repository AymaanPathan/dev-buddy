export interface Comment {
  text: string;
  line: number;
  type: "single-line" | "multi-line";
  startColumn: number;
  endColumn: number;
}

export function extractComments(
  code: string,
  language: string = "javascript"
): Comment[] {
  const comments: Comment[] = [];
  const lines = code.split("\n");

  const patterns = getCommentPatterns(language);

  let inMultiLineComment = false;
  let multiLineStart = { line: 0, column: 0 };
  let multiLineBuffer = "";
  let currentDelimiter = { start: "", end: "" };

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let col = 0;

    while (col < line.length) {
      if (inMultiLineComment) {
        const endIndex = line.indexOf(currentDelimiter.end, col);

        if (endIndex !== -1) {
          multiLineBuffer += line.substring(col, endIndex);

          comments.push({
            text: multiLineBuffer.trim(),
            line: multiLineStart.line,
            startColumn: multiLineStart.column,
            endColumn: endIndex + currentDelimiter.end.length,
            type: "multi-line",
          });

          inMultiLineComment = false;
          multiLineBuffer = "";
          col = endIndex + currentDelimiter.end.length;
        } else {
          multiLineBuffer += line.substring(col) + "\n";
          break;
        }
      } else {
        let foundSingleLine = false;
        for (const delimiter of patterns.singleLine) {
          if (line.substring(col).startsWith(delimiter)) {
            const commentText = line.substring(col + delimiter.length).trim();
            comments.push({
              text: commentText,
              line: lineNum,
              startColumn: col,
              endColumn: line.length,
              type: "single-line",
            });
            foundSingleLine = true;
            break;
          }
        }

        if (foundSingleLine) break;

        let foundMultiLine = false;
        for (const delimiter of patterns.multiLine) {
          if (line.substring(col).startsWith(delimiter.start)) {
            inMultiLineComment = true;
            currentDelimiter = delimiter;
            multiLineStart = { line: lineNum, column: col };
            col += delimiter.start.length;

            const endIndex = line.indexOf(delimiter.end, col);
            if (endIndex !== -1) {
              const commentText = line.substring(col, endIndex).trim();
              comments.push({
                text: commentText,
                line: lineNum,
                startColumn: multiLineStart.column,
                endColumn: endIndex + delimiter.end.length,
                type: "multi-line",
              });
              inMultiLineComment = false;
              col = endIndex + delimiter.end.length;
            }
            foundMultiLine = true;
            break;
          }
        }

        if (!foundMultiLine) {
          col++;
        }
      }
    }
  }

  return comments;
}

function getCommentPatterns(language: string) {
  const patterns: {
    [key: string]: {
      singleLine: string[];
      multiLine: { start: string; end: string }[];
    };
  } = {
    javascript: {
      singleLine: ["//"],
      multiLine: [{ start: "/*", end: "*/" }],
    },
    typescript: {
      singleLine: ["//"],
      multiLine: [{ start: "/*", end: "*/" }],
    },
    python: {
      singleLine: ["#"],
      multiLine: [
        { start: '"""', end: '"""' },
        { start: "'''", end: "'''" },
      ],
    },
    java: {
      singleLine: ["//"],
      multiLine: [{ start: "/*", end: "*/" }],
    },
    cpp: {
      singleLine: ["//"],
      multiLine: [{ start: "/*", end: "*/" }],
    },
    c: {
      singleLine: ["//"],
      multiLine: [{ start: "/*", end: "*/" }],
    },
    ruby: {
      singleLine: ["#"],
      multiLine: [{ start: "=begin", end: "=end" }],
    },
    php: {
      singleLine: ["//", "#"],
      multiLine: [{ start: "/*", end: "*/" }],
    },
  };

  return patterns[language.toLowerCase()] || patterns.javascript;
}

export function logComments(comments: Comment[]) {
  console.group("🔍 Detected Comments");
  console.log(`Total: ${comments.length}`);

  comments.forEach((comment, index) => {
    console.log(`\n[${index + 1}] Line ${comment.line + 1} (${comment.type})`);
    console.log(`   Text: "${comment.text}"`);
    console.log(`   Position: col ${comment.startColumn}-${comment.endColumn}`);
  });

  console.groupEnd();
}

export function testCommentDetection() {
  console.log("\n=== Testing JavaScript ===");
  const jsCode = `
// This is a single-line comment
function hello() {
  /* This is a 
     multi-line comment */
  console.log("Hello"); // Inline comment
}
`;
  const jsComments = extractComments(jsCode, "javascript");
  logComments(jsComments);

  console.log("\n=== Testing Python ===");
  const pythonCode = `
# This is a Python comment
def hello():
    """
    This is a docstring
    Multi-line documentation
    """
    print("Hello")  # Inline comment
`;
  const pyComments = extractComments(pythonCode, "python");
  logComments(pyComments);
}
