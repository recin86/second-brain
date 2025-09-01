export interface ClassificationResult {
  type: 'thought' | 'todo' | 'radiology' | 'investment';
  content: string;
  icon: string;
  description: string;
  tags?: string[];
  dueDate?: Date;
  statusMessage: string;
}

import { classifyRadiologyInput } from './tagParser';

export function classifyInput(input: string): ClassificationResult {
  const trimmed = input.trim();
  
  // Check for Investment note first (ends with ' or ;;)
  if (trimmed.endsWith("'") || trimmed.endsWith(";;")) {
    const content = trimmed.endsWith(";;") 
      ? trimmed.slice(0, -2).trim() 
      : trimmed.slice(0, -1).trim();
    
    return {
      type: 'investment',
      content: content,
      icon: '💰',
      description: '투자로 저장',
      statusMessage: '내 투자에 저장됩니다'
    };
  }
  
  // Check for Radiology note
  const radiologyResult = classifyRadiologyInput(trimmed);
  if (radiologyResult) {
    return {
      ...radiologyResult,
      statusMessage: '영상의학에 저장됩니다'
    };
  }
  
  if (trimmed.endsWith(';')) {
    let content = trimmed.slice(0, -1).trim();
    let dueDate: Date | undefined = undefined;

    const dateRegex = /\s@(.+)$/;
    const match = content.match(dateRegex);

    if (match && match[1]) {
      const dateString = match[1];
      const parsedDate = new Date(dateString);
      // 유효한 날짜인지 확인. Invalid Date가 아니어야 함.
      if (!isNaN(parsedDate.getTime())) {
        dueDate = parsedDate;
        content = content.replace(dateRegex, '').trim();
      }
    }

    return {
      type: 'todo',
      content: content,
      icon: '✅',
      description: dueDate ? `할 일로 저장 (마감일: ${dueDate.toLocaleDateString()})` : '할 일로 저장 + 캘린더 등록',
      dueDate: dueDate,
      statusMessage: '내 할 일에 저장됩니다'
    };
  }
  
  return {
    type: 'thought',
    content: trimmed,
    icon: '💭',
    description: '내 생각으로 저장',
    statusMessage: '내 생각에 저장됩니다'
  };
}