'use client'

import { useState, ChangeEvent } from 'react'

interface Answer {
  chapter: string
  pageNumber: string
  answer: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileType = selectedFile.type
      const fileName = selectedFile.name.toLowerCase()

      if (
        fileType === 'application/pdf' ||
        fileType === 'text/plain' ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.pdf')
      ) {
        setFile(selectedFile)
        setError('')
        setAnswer(null)
      } else {
        setError('कृपया PDF या TXT फाइल अपलोड करें')
        setFile(null)
      }
    }
  }

  const handleAskQuestion = async () => {
    if (!file || !question.trim()) {
      setError('कृपया पहले किताब अपलोड करें और सवाल लिखें')
      return
    }

    setLoading(true)
    setError('')
    setAnswer(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('question', question)

      const response = await fetch('/api/ask', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('सर्वर में समस्या आई')
      }

      const data = await response.json()
      setAnswer(data)
    } catch (err) {
      setError('कुछ गलत हो गया। कृपया दोबारा प्रयास करें।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📚 किताब सवाल-जवाब एजेंट</h1>
        <p>अपनी किताब अपलोड करें और कोई भी सवाल पूछें</p>
      </div>

      <div className={`upload-section ${file ? 'has-file' : ''}`}>
        <input
          type="file"
          id="file-upload"
          className="file-input"
          accept=".pdf,.txt"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="upload-label">
          <div className="upload-icon">{file ? '✅' : '📤'}</div>
          <div>
            {file ? (
              <>
                <p style={{ fontSize: '1.2rem', color: '#52c41a' }}>फाइल अपलोड हो गई!</p>
                <p className="file-name">{file.name}</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  अपनी किताब यहां अपलोड करें
                </p>
                <p style={{ color: '#999' }}>PDF या TXT फाइल चुनें</p>
              </>
            )}
          </div>
        </label>
      </div>

      {file && (
        <div className="qa-section">
          <input
            type="text"
            className="question-input"
            placeholder="अपना सवाल यहां लिखें... (उदाहरण: इस किताब का मुख्य विषय क्या है?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          />
          <button
            className="ask-button"
            onClick={handleAskQuestion}
            disabled={loading || !question.trim()}
          >
            {loading ? '⏳ जवाब ढूंढ रहे हैं...' : '🔍 सवाल पूछें'}
          </button>
        </div>
      )}

      {loading && (
        <div className="loading">
          <p>किताब को स्कैन कर रहे हैं और जवाब ढूंढ रहे हैं...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>❌ त्रुटि:</strong> {error}
        </div>
      )}

      {answer && (
        <div className="answer-section">
          <h3>📖 जवाब मिल गया:</h3>

          <div className="chapter-info">
            <p><strong>📑 अध्याय/पाठ:</strong> {answer.chapter}</p>
            <p><strong>📄 पेज संख्या:</strong> {answer.pageNumber}</p>
          </div>

          <div className="answer-text">
            <strong>💡 उत्तर:</strong>
            <p style={{ marginTop: '10px' }}>{answer.answer}</p>
          </div>
        </div>
      )}
    </div>
  )
}
