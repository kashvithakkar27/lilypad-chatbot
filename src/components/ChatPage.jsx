import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, RotateCcw, Sparkles, Zap, ArrowLeftRight,
  MapPin, Bike, ChevronRight, Plus,
} from 'lucide-react'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import { handleUserMessage } from '../utils/mcp'

const cards = [
  { text: 'Best Electric Scooters', query: 'Best electric scooter under 1 lakh', desc: 'AI-powered recommendations', Icon: Zap },
  { text: 'Compare EV Brands', query: 'Compare top EV brands', desc: 'Side-by-side comparison', Icon: ArrowLeftRight },
  { text: 'Find Dealers Near You', query: 'Find EV dealers near me', desc: 'Locate nearby showrooms', Icon: MapPin },
  { text: 'Latest EV Models', query: 'Latest EV models', desc: 'New launches & specs', Icon: Bike },
]

const chips = ['Best scooter under ₹1L', 'Ola vs Ather', 'EV dealers in Bangalore', 'Ather 450X specs']

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const hasMessages = messages.length > 0

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isLoading])
  useEffect(() => { inputRef.current?.focus() }, [])

  const send = useCallback(async (text) => {
    const q = (text || input).trim()
    if (!q || isLoading) return
    setMessages(m => [...m, { role: 'user', content: q, products: [] }])
    setInput('')
    setIsLoading(true)
    try {
      // 30 second timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30000)
      )
      const res = await Promise.race([handleUserMessage(q), timeout])
      const answer = res.answer || "I couldn't find an answer for that. Try rephrasing your question."
      setMessages(m => [...m, { role: 'assistant', content: answer, products: res.products || [] }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I couldn't get a response. Please try again.", products: [] }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading])

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="h-screen flex flex-col bg-surface-primary overflow-hidden surface-noise">

      {/* ══════ HEADER ══════ */}
      <header className="relative h-[56px] border-b border-outline/30
                         bg-nav-bar
                         px-5 sm:px-8 flex items-center justify-between flex-shrink-0 z-20">
        <div className="absolute inset-x-0 bottom-0 h-px neon-line opacity-60" />

        <div className="flex items-center gap-3">
          {/* Lilypad logo — same as Header.jsx */}
          <img src="/lilylogo.png" alt="Lilypad" className="h-8" />
          <div className="w-px h-6 bg-outline/30" />
          <p className="text-[13px] text-onSurface-quaternary font-inter flex items-center gap-1.5">
            <span className="w-[6px] h-[6px] rounded-full bg-[#00e8a0] online-dot" />
            AI Assistant
          </p>
        </div>

        <AnimatePresence>
          {hasMessages && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => { setMessages([]); setInput('') }}
              className="h-8 rounded-full px-3.5 text-[11px] font-inter font-medium
                         text-onSurface-tertiary border border-outline/40
                         hover:text-highlight hover:border-highlight/30
                         transition-all duration-300 flex items-center gap-1.5"
            >
              <Plus size={12} className="rotate-45" />
              New chat
            </motion.button>
          )}
        </AnimatePresence>
      </header>

      {/* ══════ MAIN ══════ */}
      <main className="flex-1 overflow-hidden flex flex-col relative" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {!hasMessages ? (

            /* ────── LANDING ────── */
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col px-5 overflow-y-auto"
            >
              {/* Top section — hero + cards, pushed down with flex grow */}
              <div className="flex-1 flex flex-col items-center justify-center
                              w-full max-w-[620px] mx-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center w-full"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-14 h-14 mx-auto mb-6 rounded-2xl
                               bg-gradient-to-br from-highlight/10 to-shadow/10
                               flex items-center justify-center hero-glow
                               ring-1 ring-highlight/10"
                  >
                    <Sparkles size={22} className="text-highlight" />
                  </motion.div>

                  <h2 className="font-raleway font-bold text-[28px] sm:text-[34px] leading-[1.1]
                                 text-onSurface-primary mb-2.5 tracking-[-0.02em]">
                    What can I help{' '}
                    <span className="gradient-text">you find?</span>
                  </h2>

                  <p className="font-inter text-[14px] text-onSurface-quaternary leading-relaxed
                                max-w-[400px] mx-auto mb-8">
                    Search EVs, compare specs, check prices, or locate dealers.
                  </p>
                </motion.div>

                {/* Cards — wider grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mb-6">
                  {cards.map((c, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => send(c.query)}
                      className="flex items-center gap-3 px-4 py-3.5 text-left
                                 rounded-xl cursor-pointer group transition-all duration-300
                                 bg-surface-secondary/60 border border-outline/25
                                 hover:bg-surface-secondary hover:border-outline/50
                                 hover:shadow-[0_4px_24px_rgba(0,107,107,0.12)]
                                 hover:-translate-y-0.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-surface-tertiary/60
                                      flex items-center justify-center flex-shrink-0
                                      group-hover:bg-highlight/8 transition-colors duration-300">
                        <c.Icon size={16} className="text-onSurface-quaternary group-hover:text-highlight transition-colors duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-inter font-medium text-onSurface-secondary
                                      group-hover:text-onSurface-primary transition-colors duration-300 leading-tight">
                          {c.text}
                        </p>
                        <p className="text-[11px] text-onSurface-quaternary/70 mt-0.5 leading-tight">{c.desc}</p>
                      </div>
                      <ChevronRight size={13}
                        className="text-outline group-hover:text-onSurface-quaternary
                                   transition-all duration-300 group-hover:translate-x-0.5 flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>

                {/* Chips */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.4 }}
                  className="flex flex-wrap items-center justify-center gap-1.5"
                >
                  {chips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => send(chip)}
                      className="px-3 py-[5px] rounded-full text-[11px] font-inter
                                 text-onSurface-quaternary border border-outline/25
                                 hover:border-outline/50 hover:text-onSurface-tertiary
                                 hover:bg-surface-secondary/40
                                 transition-all duration-200 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </motion.div>
              </div>

              {/* Bottom pinned input */}
              <div className="w-full max-w-[620px] mx-auto pb-6 pt-5 flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  <InputBar
                    inputRef={inputRef} input={input} setInput={setInput}
                    onSend={() => send()} onKey={onKey} isLoading={isLoading}
                  />
                </motion.div>
              </div>
            </motion.div>

          ) : (

            /* ────── CONVERSATION ────── */
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto chat-scrollbar">
                <div className="max-w-[780px] mx-auto px-5 sm:px-6 pt-6 pb-4 space-y-5">
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={endRef} />
                </div>
              </div>

              {/* Bottom input — glass bar */}
              <div className="flex-shrink-0 border-t border-outline/20 bg-surface-primary/80
                              backdrop-blur-xl">
                <div className="max-w-[780px] mx-auto px-5 sm:px-6 py-3">
                  {/* Typing indicator above input */}
                  {isLoading && (
                    <div className="flex items-center gap-2 mb-2 pl-1">
                      <div className="flex items-center gap-[5px]">
                        {[0, 1, 2].map((i) => (
                          <span key={i}
                            className="w-[5px] h-[5px] bg-highlight/60 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-onSurface-quaternary/60 font-inter">
                        Lilypad is typing
                      </span>
                    </div>
                  )}
                  <InputBar
                    inputRef={inputRef} input={input} setInput={setInput}
                    onSend={() => send()} onKey={onKey} isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="flex-shrink-0 py-1.5 text-center">
        <a href="https://lilypad.co.in" target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 text-[10px] text-onSurface-quaternary/40
                      font-inter hover:text-onSurface-quaternary transition-colors duration-300">
          Powered by <span className="gradient-text font-medium">Lilypad</span>
        </a>
      </footer>
    </div>
  )
}

/* ══════ INPUT BAR — Lilypad SearchInput style ══════ */
function InputBar({ inputRef, input, setInput, onSend, onKey, isLoading }) {
  return (
    <div className="relative flex items-center w-full">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        placeholder="Ask about electric vehicles..."
        disabled={isLoading}
        className="w-full py-3 pl-4 pr-14 text-[14px] transition-all duration-300
                   border rounded-full outline-none font-inter
                   text-onSurface-primary bg-surface-secondary
                   border-outline/60
                   focus:ring-1 focus:ring-highlight/30 focus:border-highlight/40
                   disabled:opacity-50
                   placeholder:text-onSurface-quaternary/60"
      />

      <div className="absolute right-1 flex items-center">
        <button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-full
                     border border-outline/60
                     text-onSurface-tertiary
                     hover:bg-surface-tertiary hover:text-onSurface-primary
                     focus:outline-none
                     transition-all duration-200
                     disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
