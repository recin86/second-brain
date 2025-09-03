import { classifyInput } from './classifier';
import { dataService } from '../services/dataService';
import type { ClassificationResult } from './classifier';
import type { Thought, Todo, RadiologyNote, Investment } from '../types';

export type ItemType = Thought | Todo | RadiologyNote | Investment;
export type ItemTypeString = 'thought' | 'todo' | 'radiology' | 'investment';

/**
 * Smart edit handler that automatically converts items to different categories based on content
 */
export async function smartEditItem(
  item: ItemType,
  currentType: ItemTypeString,
  newContent: string
): Promise<{ converted: boolean; newType?: ItemTypeString }> {
  const classification = classifyInput(newContent);
  
  // If the classification suggests the same type, just update content
  if (classification.type === currentType) {
    await updateItemContent(item.id, currentType, classification);
    return { converted: false };
  }
  
  // If classification suggests a different type, convert the item
  await convertItemToNewType(item.id, currentType, classification.type, classification);
  return { converted: true, newType: classification.type };
}

/**
 * Update item content without changing category
 */
async function updateItemContent(
  itemId: string, 
  itemType: ItemTypeString, 
  classification: ClassificationResult
): Promise<void> {
  switch (itemType) {
    case 'thought':
      await dataService.updateThought(itemId, { content: classification.content });
      break;
    case 'todo':
      await dataService.updateTodo(itemId, { 
        content: classification.content,
        ...(classification.dueDate && { dueDate: classification.dueDate })
      });
      break;
    case 'radiology':
      await dataService.updateRadiologyNote(itemId, { 
        content: classification.content,
        ...(classification.tags && { tags: classification.tags })
      });
      break;
    case 'investment':
      await dataService.updateInvestment(itemId, { content: classification.content });
      break;
  }
}

/**
 * Convert item to a different category
 */
async function convertItemToNewType(
  itemId: string,
  fromType: ItemTypeString,
  toType: ItemTypeString,
  classification: ClassificationResult
): Promise<void> {
  let newItemId = itemId;

  // Convert to the new type first
  switch (toType) {
    case 'thought':
      newItemId = await dataService.convertToThought(itemId, fromType as any);
      break;
    case 'todo':
      newItemId = await dataService.convertToTodo(itemId, fromType as any);
      break;
    case 'radiology':
      newItemId = await dataService.convertToRadiology(itemId, fromType as any);
      break;
    case 'investment':
      newItemId = await dataService.convertToInvestment(itemId, fromType as any);
      break;
  }

  // Then update with the new classification data using the correct target type
  await updateItemContent(newItemId, toType, classification);
}