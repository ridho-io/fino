'use server';
/**
 * @fileOverview A Genkit flow for extracting key details from a receipt image.
 *
 * - extractReceiptData - A function that handles the receipt data extraction process.
 * - ReceiptDataExtractionInput - The input type for the extractReceiptData function.
 * - ReceiptDataExtractionOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReceiptDataExtractionInputSchema = z.object({
  receiptImage: z
    .string()
    .describe(
      "A photo of a physical receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ReceiptDataExtractionInput = z.infer<typeof ReceiptDataExtractionInputSchema>;

const ReceiptDataExtractionOutputSchema = z.object({
  merchantName: z.string().describe('The name of the merchant on the receipt.'),
  transactionDate: z.string().describe('The date of the transaction on the receipt in YYYY-MM-DD format.'),
  totalAmount: z.number().describe('The total amount of the transaction on the receipt.'),
  items: z.array(z.object({
    name: z.string().describe('The name of the item.'),
    quantity: z.number().int().describe('The quantity of the item.'),
    price: z.number().describe('The price of a single unit of the item.'),
  })).optional().describe('An array of line items from the receipt, if available.'),
  currency: z.string().optional().describe('The currency used for the transaction, e.g., "USD", "EUR".'),
});
export type ReceiptDataExtractionOutput = z.infer<typeof ReceiptDataExtractionOutputSchema>;

export async function extractReceiptData(input: ReceiptDataExtractionInput): Promise<ReceiptDataExtractionOutput> {
  return receiptDataExtractionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'receiptDataExtractionPrompt',
  input: { schema: ReceiptDataExtractionInputSchema },
  output: { schema: ReceiptDataExtractionOutputSchema },
  prompt: `You are an expert at extracting structured data from receipt images. Your task is to accurately parse the provided receipt image and extract the following information:
- Merchant Name
- Date of transaction (in YYYY-MM-DD format)
- Total amount of the transaction
- Individual line items (name, quantity, price) if present and clearly legible
- Currency used for the transaction

If any information is not clearly visible or cannot be confidently extracted, omit it from the output, or return an appropriate default (e.g., empty array for items).

Receipt Image: {{media url=receiptImage}}`,
});

const receiptDataExtractionFlow = ai.defineFlow(
  {
    name: 'receiptDataExtractionFlow',
    inputSchema: ReceiptDataExtractionInputSchema,
    outputSchema: ReceiptDataExtractionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
