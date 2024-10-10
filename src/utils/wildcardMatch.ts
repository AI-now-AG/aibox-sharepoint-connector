export const wildcardMatch = (text: string, pattern: string) => {
  // Convert wildcard pattern to a
  // regular expression pattern
  const regexPattern = new RegExp(
    "^" + pattern.replace(/\?/g, ".").replace(/\*/g, ".*") + "$",
  );

  // Test if the text matches the
  // regular expression pattern
  return regexPattern.test(text);
};

export default wildcardMatch;
