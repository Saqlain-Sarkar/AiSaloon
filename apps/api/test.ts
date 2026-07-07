import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log("Connecting to DB...");
  const business = await prisma.business.findFirst();
  console.log("Business found:", business?.id);
  
  console.log("Testing NVIDIA AI...");
  import('openai').then(({default: OpenAI}) => {
    const openai = new OpenAI({ 
      apiKey: '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', 
      baseURL: 'https://integrate.api.nvidia.com/v1' 
    });
    return openai.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{role:'system', content: 'You must return JSON. {\"test\": true}'}, {role:'user', content:'hello'}],
      max_tokens: 1024
    });
  }).then(c => {
    console.log("NVIDIA Response:", c.choices[0].message.content);
    process.exit(0);
  }).catch(e => {
    console.error("NVIDIA Error:", e);
    process.exit(1);
  });
}
main().catch(e => {
  console.error("Prisma Error:", e);
  process.exit(1);
});
