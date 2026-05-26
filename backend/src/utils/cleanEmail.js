export const cleanEmailBody = (text) => {

  if (!text) return "";

  // Remove URLs
  text = text.replace(/https?:\/\/\S+/g, "");

  // Remove brackets
  text = text.replace(/\[.*?\]/g, "");

  // Remove empty parentheses
  text = text.replace(/\(\s*\)/g, "");

  // Remove stars formatting
  text = text.replace(/\*+/g, "");

  // Remove unsubscribe/privacy words
  text = text.replace(/unsubscribe/gi, "");
  text = text.replace(/privacy policy/gi, "");

  // Remove extra spaces
  text = text.replace(/\s+/g, " ");

  // Trim
  text = text.trim();

  return text;
};