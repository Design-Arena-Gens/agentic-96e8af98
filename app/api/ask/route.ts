import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const text = new TextDecoder().decode(buffer)
  return text
}

function chunkText(text: string, chunkSize: number = 3000): string[] {
  const chunks: string[] = []
  const lines = text.split('\n')
  let currentChunk = ''

  for (const line of lines) {
    if ((currentChunk + line).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = line + '\n'
    } else {
      currentChunk += line + '\n'
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const question = formData.get('question') as string

    if (!file || !question) {
      return NextResponse.json(
        { error: 'फाइल और सवाल दोनों जरूरी हैं' },
        { status: 400 }
      )
    }

    const bookText = await extractTextFromFile(file)

    if (!bookText || bookText.trim().length < 10) {
      return NextResponse.json(
        { error: 'फाइल खाली है या पढ़ी नहीं जा सकी' },
        { status: 400 }
      )
    }

    const chunks = chunkText(bookText, 8000)

    const prompt = `आप एक किताब विश्लेषण AI एजेंट हैं। नीचे दी गई किताब का टेक्स्ट पढ़ें और सवाल का जवाब दें।

किताब का टेक्स्ट:
${chunks[0]}${chunks.length > 1 ? '\n\n[किताब का और भी हिस्सा है...]' : ''}

सवाल: ${question}

कृपया निम्नलिखित JSON फॉर्मेट में जवाब दें:
{
  "chapter": "अध्याय/पाठ का नाम या नंबर (अगर मिले तो)",
  "pageNumber": "अनुमानित पेज नंबर या सेक्शन",
  "answer": "सवाल का विस्तृत जवाब"
}

नोट:
- अगर अध्याय का नाम नहीं मिले तो "सामान्य सामग्री" लिखें
- जवाब हिंदी में दें
- जवाब संक्षिप्त लेकिन पूर्ण होना चाहिए`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    let jsonMatch = responseText.match(/\{[\s\S]*\}/)
    let result

    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0])
    } else {
      result = {
        chapter: 'सामान्य सामग्री',
        pageNumber: 'पूरी किताब',
        answer: responseText || 'जवाब नहीं मिल सका'
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'कुछ गलत हो गया। कृपया दोबारा प्रयास करें।' },
      { status: 500 }
    )
  }
}
