export function normalizeCourseCode(input: string) {
    return input
      .trim()
      .toUpperCase()
      .replace(/[\s_-]+/g, "")     // remove spaces, underscores, hyphens
      .replace(/[^A-Z0-9]/g, "");  // drop anything else
  }  