// utils/commentDetector.ts

export interface Comment {
  line: number;
  text: string;
  type: "single" | "multi";
}

export const extractComments = (code: string, language: string): Comment[] => {
  const comments: Comment[] = [];
  const lines = code.split("\n");

  // Define comment patterns by language
  const singleLinePatterns: Record<string, RegExp> = {
    javascript: /^\s*\/\/\s*(.+)$/,
    typescript: /^\s*\/\/\s*(.+)$/,
    python: /^\s*#\s*(.+)$/,
    ruby: /^\s*#\s*(.+)$/,
    shell: /^\s*#\s*(.+)$/,
    r: /^\s*#\s*(.+)$/,
    perl: /^\s*#\s*(.+)$/,
    lua: /^\s*--\s*(.+)$/,
    sql: /^\s*--\s*(.+)$/,
    haskell: /^\s*--\s*(.+)$/,
  };

  const multiLinePatterns: Record<
    string,
    { start: RegExp; end: RegExp; inline: RegExp }
  > = {
    javascript: {
      start: /^\s*\/\*\*?/,
      end: /\*\/\s*$/,
      inline: /\/\*(.+?)\*\//g,
    },
    typescript: {
      start: /^\s*\/\*\*?/,
      end: /\*\/\s*$/,
      inline: /\/\*(.+?)\*\//g,
    },
    css: {
      start: /^\s*\/\*/,
      end: /\*\/\s*$/,
      inline: /\/\*(.+?)\*\//g,
    },
    html: {
      start: /^\s*<!--/,
      end: /-->\s*$/,
      inline: /<!--(.+?)-->/g,
    },
    python: {
      start: /^\s*"""/,
      end: /"""\s*$/,
      inline: /"""(.+?)"""/g,
    },
  };

  const pattern = singleLinePatterns[language] || singleLinePatterns.javascript;
  const multiPattern = multiLinePatterns[language];

  let inMultiLineComment = false;
  let multiLineCommentText = "";
  let multiLineStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle multi-line comments
    if (multiPattern) {
      // Check for inline multi-line comments
      const inlineMatches = line.matchAll(multiPattern.inline);
      for (const match of inlineMatches) {
        const text = match[1].trim();
        if (text) {
          comments.push({
            line: i,
            text,
            type: "multi",
          });
        }
      }

      // Check for multi-line comment start
      if (!inMultiLineComment && multiPattern.start.test(line)) {
        inMultiLineComment = true;
        multiLineStartLine = i;
        multiLineCommentText = line
          .replace(multiPattern.start, "")
          .replace(multiPattern.end, "")
          .trim();

        // Check if comment ends on same line
        if (multiPattern.end.test(line)) {
          inMultiLineComment = false;
          if (multiLineCommentText) {
            comments.push({
              line: i,
              text: multiLineCommentText,
              type: "multi",
            });
          }
          multiLineCommentText = "";
        }
        continue;
      }

      // Continue multi-line comment
      if (inMultiLineComment) {
        const cleanLine = line
          .replace(/^\s*\*\s?/, "")
          .replace(multiPattern.end, "")
          .trim();
        if (cleanLine) {
          multiLineCommentText += " " + cleanLine;
        }

        // Check if comment ends
        if (multiPattern.end.test(line)) {
          inMultiLineComment = false;
          if (multiLineCommentText.trim()) {
            comments.push({
              line: multiLineStartLine,
              text: multiLineCommentText.trim(),
              type: "multi",
            });
          }
          multiLineCommentText = "";
        }
        continue;
      }
    }

    // Handle single-line comments - FIXED: Capture entire line after comment marker
    const match = line.match(pattern);
    if (match && match[1]) {
      const text = match[1].trim();
      if (text) {
        comments.push({
          line: i,
          text,
          type: "single",
        });
      }
    }
  }

  return comments;
};
