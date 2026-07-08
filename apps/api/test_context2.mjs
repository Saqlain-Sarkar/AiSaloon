import OpenAI from 'openai';
const openai = new OpenAI({ 
  apiKey: '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', 
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 15000
});

async function run() {
  const messages = [
    {role:'system', content: 'You are a salon receptionist. Context: User wants a beard trim. You asked for a date.\nRULES:\n1. CANCELLATION / NO: Understand local words for "No" (e.g. "Nahi", "Na", "No"). If the user says "No" or cancels a booking flow, set action to "NONE", empty the extractedData (reset date/time/serviceIds to empty arrays/strings), acknowledge them, and ask how else you can help.'},
    {role:'user', content: 'Muje beard karwana bai'},
    {role:'assistant', content: '{"response": "What date would you like to book the beard trim for?", "action": {"type": "REQUEST_INFO"}}'},
    {role:'user', content: 'Nahi'}
  ];
  
  try {
    const res = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 1024
    });
    console.log(res.choices[0].message.content);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
