import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const systemPrompt = `You are an inspirational quote generator. Create meaningful, uplifting quotes that inspire people to take action, think differently, or feel motivated. Quotes should be original, thoughtful, and appropriate for a daily inspiration app.`
    
    const userPrompt = `Generate an inspirational quote for today. The quote should be:
- Meaningful and thought-provoking
- Uplifting and motivating
- Appropriate for a daily inspiration app
- Between 10-30 words

Return a JSON object with this exact format:
{"quote": "The quote text here", "author": "Author name (optional, can be null)"}

If you don't have a specific author in mind, you can use "Anonymous" or leave it as null.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 200
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from OpenAI')

    const parsed = JSON.parse(response)
    const quote = parsed.quote || ''
    const author = parsed.author || undefined

    if (!quote) {
      throw new Error('AI did not return a valid quote')
    }

    return new Response(JSON.stringify({ quote, author }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Error generating quote:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

