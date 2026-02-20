import { useState, useRef, useEffect } from 'react'
import OpenAI from 'openai'
import './App.css'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_GROK_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
})

const SYSTEM_PROMPT = `You are an expert sound designer and audio describer. Your job is to take an action, scene, or event described by the user and produce a rich, vivid, sensory description of exactly how that sound should FEEL and SOUND.

When a user describes an action (e.g., "Dragon breathing fire", "Rain on a tin roof", "Sword being unsheathed"), respond with a structured sound profile in this exact format:

🎬 **Action:** (restate the action/scene)

🔊 **How It Sounds:**
Describe the auditory qualities in detail — pitch (low/high), texture (smooth, gritty, crackling), rhythm (steady, pulsing, sudden), duration (short burst, sustained drone), layers (what sounds overlap), and any tonal shifts over time. Use onomatopoeia where helpful.

🎭 **How It Feels:**
Describe the physical and emotional sensation — does it vibrate in your chest, tingle your spine, feel warm or cold, create tension or relief? What mood does it evoke? How would it feel if you were standing right there?

🎛️ **Sound Design Breakdown:**
- **Attack:** How does the sound begin? (sharp, gradual, explosive)
- **Body:** What is the sustained core of the sound? (rumbling, hissing, ringing)
- **Decay:** How does it fade? (abrupt cutoff, slow echo, lingering reverb)
- **Frequency Range:** Low-end (sub-bass, bass), mid-range, or high-end (treble, sizzle)
- **Environment:** How does the space shape the sound? (open air, enclosed room, cavernous echo)

🎨 **Cinematic Comparison:**
Compare it to a sound from a well-known movie, game, or real-world experience so the user can instantly "hear" it in their mind.

Rules:
- Always output the full structured profile above
- Be extremely vivid, poetic, and precise — paint the sound with words
- Use sensory metaphors and synesthesia (e.g., "the sound is dark amber")
- Include onomatopoeia naturally (e.g., WHOOOOSH, crrrack, sssssss)
- Keep each section concise but evocative (2-4 sentences)
- If the user gives a vague description, imagine the most dramatic/cinematic version
- If the user asks follow-up questions about sound design, answer helpfully
- Use emojis sparingly to enhance readability`

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 🎧 I'm your Sound Describer. Tell me any action, scene, or event — like \"Dragon breathing fire\" or \"Walking through crunchy autumn leaves\" — and I'll paint a vivid picture of exactly how that sound should feel and sound. 🔊",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await client.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.choices[0].message.content,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Oops! Something went wrong 😢 — ${err.message}. Make sure your API key is set in the .env file!`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-icon">🔊</div>
        <div>
          <h1>Sound Describer</h1>
          <p>Describe an action — hear it in words</p>
        </div>
      </header>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            <div className="avatar">{msg.role === 'assistant' ? '🎧' : '🎤'}</div>
            <div className={`bubble ${msg.role}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="avatar">🎧</div>
            <div className="bubble assistant typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe an action, e.g. 'Dragon breathing fire', 'Thunder in mountains'... 🎬"
          rows={1}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  )
}

export default App
