export interface ClassificationResult {
  type: 'thought' | 'todo' | 'radiology';
  content: string;
  icon: string;
  description: string;
  tags?: string[];
}

import { classifyRadiologyInput, extractTags, removeTagsFromContent } from './tagParser';

export function classifyInput(input: string): ClassificationResult {
  const trimmed = input.trim();
  
  // Check for Radiology note first
  const radiologyResult = classifyRadiologyInput(trimmed);
  if (radiologyResult) {
    return radiologyResult;
  }
  
  if (trimmed.endsWith(';')) {
    return {
      type: 'todo',
      content: trimmed.slice(0, -1).trim(),
      icon: '✅',
      description: '할 일로 저장 + 캘린더 등록'
    };
  }
  
  return {
    type: 'thought',
    content: trimmed,
    icon: '💭',
    description: '내 생각으로 저장'
  };
}