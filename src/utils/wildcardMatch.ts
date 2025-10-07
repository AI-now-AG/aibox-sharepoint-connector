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

export const wildcardMatchInArray = (text: string, patterns: string[]) => {
  const matchPaths = patterns.filter((pattern: string) => {
    return wildcardMatch(text, pattern);
  });

  return matchPaths.length ? true : false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function omitWithWildcard<T extends Record<string, any>>(
  obj: T,
  excludedPatterns: string[] = [],
): Partial<T> {
  const patterns = excludedPatterns.map((pattern) => {
    // Escape regex special chars except '*'
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*"); // turn * into .*
    return new RegExp(`^${regexPattern}$`);
  });

  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key]) => !patterns.some((regex) => regex.test(key)),
    ),
  ) as Partial<T>;
}

export default wildcardMatch;
