export const getTextLines = (text: string): string[] => {
  return text.split('\n');
};

export const truncateToLines = (text: string, maxLines: number): string => {
  const lines = getTextLines(text);
  if (lines.length <= maxLines) {
    return text;
  }
  return lines.slice(0, maxLines).join('\n');
};

export const isTextLong = (text: string, maxLines: number = 5): boolean => {
  return getTextLines(text).length > maxLines;
};

export const getPreviewText = (text: string, maxLines: number = 5): string => {
  const lines = getTextLines(text);
  if (lines.length <= maxLines) {
    return text;
  }
  return lines.slice(0, maxLines).join('\n');
};