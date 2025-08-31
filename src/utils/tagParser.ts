export const extractTags = (content: string): string[] => {
  const tagRegex = /#\w+/g;
  const matches = content.match(tagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
};

export const isRadiologyNote = (content: string): boolean => {
  const tags = extractTags(content);
  return tags.some(tag => tag === '#rad');
};

export const getRadiologySubtags = (content: string): string[] => {
  const tags = extractTags(content);
  const radIndex = tags.findIndex(tag => tag === '#rad');
  
  if (radIndex === -1) return [];
  
  // #Rad 이후의 모든 태그들을 반환
  return tags.slice(radIndex + 1);
};

export const removeTagsFromContent = (content: string): string => {
  return content.replace(/#\w+/g, '').trim().replace(/\s+/g, ' ');
};

export const classifyRadiologyInput = (content: string) => {
  if (!isRadiologyNote(content)) {
    return null;
  }

  const subtags = getRadiologySubtags(content);
  const cleanContent = removeTagsFromContent(content);
  
  return {
    type: 'radiology' as const,
    content: cleanContent,
    tags: extractTags(content),
    subtags,
    icon: '🏥',
    description: subtags.length > 0 
      ? `Radiology note with tags: ${subtags.join(', ')}` 
      : 'Radiology note'
  };
};