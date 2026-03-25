import { Sparkles } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-highlight/15 to-shadow/15
                      flex items-center justify-center flex-shrink-0 mt-1
                      ring-1 ring-highlight/10">
        <Sparkles size={10} className="text-highlight" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="text-[10px] font-inter font-medium tracking-wide uppercase text-highlight/40 pl-1">
          Lilypad
        </span>

        {/* Typing bubble with 3 dots */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 24px',
          background: '#272727',
          border: '1px solid rgba(72,72,72,0.3)',
          borderRadius: '16px',
          borderTopLeftRadius: '4px',
        }}>
          <Dot delay="0s" />
          <Dot delay="0.2s" />
          <Dot delay="0.4s" />
        </div>
      </div>
    </div>
  )
}

function Dot({ delay }) {
  return (
    <span
      style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#00ffff',
        display: 'inline-block',
        animation: `dotBounce 1.2s ${delay} infinite ease-in-out`,
      }}
    />
  )
}
