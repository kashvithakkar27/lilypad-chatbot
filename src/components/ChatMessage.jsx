import { motion } from 'framer-motion'
import ProductCard from './ProductCard'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const products = message.products || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-highlight/15 to-shadow/15
                        flex items-center justify-center flex-shrink-0 mt-1
                        ring-1 ring-highlight/10">
          <span className="text-highlight font-raleway font-bold text-[9px]">LP</span>
        </div>
      )}

      <div className={`max-w-[700px] flex flex-col gap-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Label */}
        <span className={`text-[10px] font-inter font-medium tracking-wide uppercase
                         ${isUser ? 'text-onSurface-quaternary/50 pr-1' : 'text-highlight/40 pl-1'}`}>
          {isUser ? 'You' : 'Lilypad'}
        </span>

        {/* Bubble */}
        <div
          className={`px-4 py-3 text-[14px] leading-[1.75] font-inter ${
            isUser
              ? 'bg-surface-secondary text-onSurface-primary rounded-2xl rounded-tr-md border border-outline/30'
              : 'bg-surface-secondary/50 text-onSurface-secondary rounded-2xl rounded-tl-md border border-outline/20'
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="message-content">
              {renderContent(message.content)}
            </div>
          )}
        </div>

        {/* Product cards */}
        {!isUser && products.length > 0 && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {products.slice(0, 6).map((product, i) => (
              <ProductCard key={product.id || i} product={product} index={i} />
            ))}
          </div>
        )}
        {!isUser && products.length > 6 && (
          <p className="text-[10px] text-onSurface-quaternary/60 font-inter pl-1">
            +{products.length - 6} more
          </p>
        )}
      </div>
    </motion.div>
  )
}

function renderContent(text) {
  if (!text) return null
  const blocks = text.split(/\n\n+/)
  return blocks.map((block, bi) => {
    const trimmed = block.trim()
    if (!trimmed) return null
    if (trimmed.includes('|') && trimmed.includes('---')) {
      return <ComparisonTable key={bi} text={trimmed} />
    }
    const lines = trimmed.split('\n')
    return (
      <div key={bi} className={bi > 0 ? 'mt-2.5' : ''}>
        {lines.map((line, li) => (
          <div key={li} className={li > 0 ? 'mt-0.5' : ''}>
            {formatLine(line)}
          </div>
        ))}
      </div>
    )
  })
}

function formatLine(line) {
  if (/^[•\-]\s/.test(line)) {
    return (
      <div className="flex gap-2 ml-0.5">
        <span className="text-highlight/30 mt-[3px] text-[10px]">●</span>
        <span>{inlineBold(line.replace(/^[•\-]\s*/, ''))}</span>
      </div>
    )
  }
  return inlineBold(line)
}

function inlineBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-highlight/90 font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function ComparisonTable({ text }) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  const parseRow = (line) => line.split('|').map(cell => cell.trim()).filter(Boolean)
  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)

  return (
    <div className="overflow-x-auto mt-2.5 mb-1 rounded-lg border border-outline/20 overflow-hidden">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-surface-tertiary/30">
            {headers.map((h, i) => (
              <th key={i}
                className={`py-2 px-3 text-left font-medium
                           ${i === 0 ? 'text-onSurface-quaternary' : 'text-highlight/80'}`}>
                {inlineBold(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-outline/10">
              {row.map((cell, ci) => (
                <td key={ci}
                  className={`py-1.5 px-3 ${ci === 0 ? 'text-onSurface-quaternary' : 'text-onSurface-tertiary'}`}>
                  {inlineBold(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
