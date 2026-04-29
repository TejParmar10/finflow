import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

interface CallOptions {
  temperature?: number
  maxTokens?: number
}

export async function callGroq(
  systemPrompt: string,
  userMessage: string,
  options: CallOptions = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 2048 } = options
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })
  return completion.choices[0]?.message?.content ?? ''
}

export async function callGroqStream(
  systemPrompt: string,
  userMessage: string,
  options: CallOptions = {}
) {
  const { temperature = 0.7, maxTokens = 1024 } = options
  return groq.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })
}

export { groq, MODEL }
