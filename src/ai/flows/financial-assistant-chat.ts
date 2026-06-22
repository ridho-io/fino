'use server';
/**
 * @fileOverview A Genkit flow for a dedicated AI financial assistant.
 *
 * - financialAssistantChat - A function that handles user queries and provides financial insights/advice.
 * - FinancialAssistantChatInput - The input type for the financialAssistantChat function.
 * - FinancialAssistantChatOutput - The return type for the financialAssistantChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialAssistantChatInputSchema = z.object({
  query: z.string().describe('The user\'s financial query or question.'),
  // For simplicity, transactionHistory is a string here. In a real app, this would be a structured object or fetched via a tool.
  transactionHistory: z.string().describe('A summary or detailed list of the user\'s transaction history relevant to the query.'),
});
export type FinancialAssistantChatInput = z.infer<typeof FinancialAssistantChatInputSchema>;

const FinancialAssistantChatOutputSchema = z.object({
  response: z.string().describe('The AI financial assistant\'s response, insight, or advice.'),
});
export type FinancialAssistantChatOutput = z.infer<typeof FinancialAssistantChatOutputSchema>;

export async function financialAssistantChat(input: FinancialAssistantChatInput): Promise<FinancialAssistantChatOutput> {
  return financialAssistantChatFlow(input);
}

const financialAssistantPrompt = ai.definePrompt({
  name: 'financialAssistantPrompt',
  input: { schema: FinancialAssistantChatInputSchema },
  output: { schema: FinancialAssistantChatOutputSchema },
  prompt: `You are Fino, an intelligent and helpful AI financial assistant. Your goal is to provide accurate answers to user's financial questions and offer proactive spending insights or advice based on their provided transaction history.

User's Query: "{{{query}}}"

Here is the user's relevant transaction history:
{{{transactionHistory}}}

Based on the query and the transaction history, provide a concise and helpful response. If the information is not available in the provided history, state that you cannot answer the question based on the given data.

Response:`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE'
      },
    ],
  },
});

const financialAssistantChatFlow = ai.defineFlow(
  {
    name: 'financialAssistantChatFlow',
    inputSchema: FinancialAssistantChatInputSchema,
    outputSchema: FinancialAssistantChatOutputSchema,
  },
  async (input) => {
    const { output } = await financialAssistantPrompt(input);
    return output!;
  }
);
