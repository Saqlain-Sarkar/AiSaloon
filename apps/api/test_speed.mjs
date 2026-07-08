import OpenAI from 'openai';
const openai = new OpenAI({ 
  apiKey: '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', 
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 10000
});

async function testModel(modelName) {
  console.time(modelName);
  try {
    const res = await openai.chat.completions.create({
      model: modelName,
      messages: [{role:'system', content: 'You must return JSON. {\"response\": \"your message in gujarati\"}'}, {role:'user', content:'Muje beard karwana hai'}],
      response_format: { type: 'json_object' },
      max_tokens: 1024
    });
    console.timeEnd(modelName);
    console.log(modelName, "Response:", res.choices[0].message.content);
  } catch(e) {
    console.timeEnd(modelName);
    console.log(modelName, "Error:", e.message);
  }
}

async function run() {
  await testModel('meta/llama-3.1-8b-instruct');
  await testModel('mistralai/mixtral-8x22b-instruct-v0.1');
}
run();
