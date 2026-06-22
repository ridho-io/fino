'use server';
/**
 * @fileOverview A Genkit flow for parsing natural language transaction descriptions.
 *
 * - parseNaturalLanguageTransaction - A function that parses a natural language sentence into structured transaction data.
 * - NaturalLanguageTransactionInput - The input type for the parseNaturalLanguageTransaction function.
 * - NaturalLanguageTransactionOutput - The return type for the parseNaturalLanguageTransaction function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NaturalLanguageTransactionInputSchema = z.object({
  sentence: z.string().describe('The natural language sentence describing a financial transaction.'),
});
export type NaturalLanguageTransactionInput = z.infer<typeof NaturalLanguageTransactionInputSchema>;

const NaturalLanguageTransactionOutputSchema = z.object({
  amount: z.number().describe('The numerical amount of the transaction.'),
  currency: z.string().optional().describe('The currency code (e.g., IDR, USD, EUR). Defaults to IDR if not specified.'),
  description: z.string().describe('A concise description of the transaction, derived from the original sentence.'),
  category: z.string().describe('The category of the transaction (e.g., Food, Transport, Salary, Bills).'),
  wallet: z.string().describe('The financial account or wallet used for the transaction (e.g., Checking Account, Credit Card, Cash).'),
  transactionDate: z.string().optional().describe('The date of the transaction in ISO 8601 format (e.g., YYYY-MM-DD). Defaults to the current date if not specified.'),
  transactionType: z.enum(['expense', 'income']).optional().describe('Whether the transaction is an expense or income. Defaults to expense if not specified.'),
});
export type NaturalLanguageTransactionOutput = z.infer<typeof NaturalLanguageTransactionOutputSchema>;

/**
 * Parses a natural language sentence into structured transaction data.
 * @param input - The input containing the natural language sentence.
 * @returns The parsed transaction data.
 */
export async function parseNaturalLanguageTransaction(input: NaturalLanguageTransactionInput): Promise<NaturalLanguageTransactionOutput> {
  return naturalLanguageTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageTransactionPrompt',
  input: { schema: NaturalLanguageTransactionInputSchema },
  output: { schema: NaturalLanguageTransactionOutputSchema },
  prompt: `You are an intelligent financial assistant named Fino. Your task is to parse a natural language sentence describing a financial transaction and extract the relevant details into a structured JSON format.

IMPORTANT: The default currency is 'IDR' (Rupiah). If the user mentions 'ribu', 'k', or 'jt', interpret them as 1,000, 1,000, and 1,000,000 respectively.

Here are the details you need to extract:
- amount: The numerical value of the transaction.
- currency: The currency code (e.g., IDR, USD, EUR). Defaults to 'IDR'.
- description: A concise summary of the transaction.
- category: The type of expense or income (e.g., 'Coffee', 'Groceries', 'Salary', 'Rent', 'Utilities').
- wallet: The account or method used (e.g., 'Bank', 'Cash', 'Credit Card').
- transactionDate: YYYY-MM-DD.
- transactionType: 'expense' or 'income'.

Examples:
Sentence: "Habis 20rb beli kopi di Starbucks pake cash"
Output: { "amount": 20000, "currency": "IDR", "description": "Beli kopi di Starbucks", "category": "Food", "wallet": "Cash", "transactionType": "expense" }

Sentence: "Gajian masuk 5 juta ke rekening"
Output: { "amount": 5000000, "currency": "IDR", "description": "Gaji masuk", "category": "Salary", "wallet": "Bank", "transactionType": "income" }

Sentence: "Paid $50 for shoes"
Output: { "amount": 50, "currency": "USD", "description": "Paid for shoes", "category": "Shopping", "wallet": "Unspecified", "transactionType": "expense" }

Now, parse the following sentence:
Sentence: {{{sentence}}}`,
});

const naturalLanguageTransactionFlow = ai.defineFlow(
  {
    name: 'naturalLanguageTransactionFlow',
    inputSchema: NaturalLanguageTransactionInputSchema,
    outputSchema: NaturalLanguageTransactionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];

    return {
      amount: output!.amount,
      currency: output!.currency || 'IDR',
      description: output!.description,
      category: output!.category,
      wallet: output!.wallet,
      transactionDate: output!.transactionDate || todayISO,
      transactionType: output!.transactionType || 'expense',
    };
  }
);