import { config } from 'dotenv';
config();

import '@/ai/flows/receipt-data-extraction-flow.ts';
import '@/ai/flows/financial-assistant-chat.ts';
import '@/ai/flows/natural-language-transaction-entry.ts';