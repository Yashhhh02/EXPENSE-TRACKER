import { callOpenRouter, getModelForTask } from './router';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function suggestCategory(
  note: string,
  amount: number,
  type: 'income' | 'expense',
  availableCategories: CategoryOption[]
): Promise<CategorizationResult> {
  // Find fallback category (preferably "Other" or first available category)
  const otherCategory =
    availableCategories.find((c) => c.name.toLowerCase() === 'other') ||
    availableCategories[0];

  const defaultFallback: CategorizationResult = {
    categoryId: otherCategory?.id || '',
    categoryName: otherCategory?.name || 'Other',
    confidence: 'low',
  };

  if (!note || note.trim().length === 0 || availableCategories.length === 0) {
    return defaultFallback;
  }

  const categoryNames = availableCategories.map((c) => c.name);
  const systemPrompt = `You are a financial transaction classification AI. Given a transaction note, amount, transaction type, and a list of valid category names, select the single most appropriate category name from the allowed list.
Output ONLY the exact category name from the list. Do not include any punctuation, quotes, markdown formatting, or explanations. If uncertain or if no category fits, output "Other".`;

  const userPrompt = `Transaction Details:
- Note: "${note}"
- Amount: ${amount}
- Type: ${type}
- Allowed Categories: ${categoryNames.join(', ')}

Suggested Category Name:`;

  try {
    const model = process.env.OPENROUTER_CATEGORIZE_MODEL || getModelForTask('categorize');
    const rawResponse = await callOpenRouter(model, systemPrompt, userPrompt, {
      maxTokens: 50,
      timeoutMs: 10000,
    });

    // Sanitize response
    const cleanedResponse = rawResponse
      .replace(/[`"'`]/g, '')
      .trim()
      .toLowerCase();

    // 1. Direct case-insensitive match
    const exactMatch = availableCategories.find(
      (c) => c.name.toLowerCase() === cleanedResponse
    );

    if (exactMatch) {
      const isOther = exactMatch.name.toLowerCase() === 'other';
      return {
        categoryId: exactMatch.id,
        categoryName: exactMatch.name,
        confidence: isOther ? 'low' : 'high',
      };
    }

    // 2. Partial containment match
    const partialMatch = availableCategories.find(
      (c) =>
        cleanedResponse.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(cleanedResponse)
    );

    if (partialMatch) {
      const isOther = partialMatch.name.toLowerCase() === 'other';
      return {
        categoryId: partialMatch.id,
        categoryName: partialMatch.name,
        confidence: isOther ? 'low' : 'medium',
      };
    }

    // Fallback if model output did not match any category
    return defaultFallback;
  } catch (error) {
    // Fail gracefully on any error (network, API key missing, timeout, etc.)
    console.warn('AI categorization failed, falling back to default:', error);
    return defaultFallback;
  }
}
