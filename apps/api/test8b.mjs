import OpenAI from 'openai';
const openai = new OpenAI({ 
  apiKey: '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', 
  baseURL: 'https://integrate.api.nvidia.com/v1' 
});
openai.chat.completions.create({
  model: 'meta/llama-3.1-8b-instruct',
  messages: [{role:'system', content: 'You must return JSON. {\"test\": true}'}, {role:'user', content:'hello'}],
  max_tokens: 1024
}).then(c => {
  console.log("Response:", c.choices[0].message.content);
}).catch(e => {
  console.error("Error:", e.message);
});
