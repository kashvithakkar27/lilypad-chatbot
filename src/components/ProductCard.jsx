import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

const LILYPAD_BASE = 'https://lilypad.co.in'

function formatPrice(price) {
  if (!price) return ''
  return '₹' + Number(price).toLocaleString('en-IN')
}

function toSlug(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function getProductUrl(product) {
  if (product.slug) return `${LILYPAD_BASE}/products/${toSlug(product.brand)}/${product.slug}`
  const bs = toSlug(product.brand), ps = toSlug(product.name)
  if (bs && ps) return `${LILYPAD_BASE}/products/${bs}/${ps}`
  if (product.id) return `${LILYPAD_BASE}/products/${product.id}`
  return null
}

export default function ProductCard({ product, index }) {
  const url = getProductUrl(product)
  const Tag = url ? 'a' : 'div'
  const linkProps = url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <Tag
        {...linkProps}
        className="rounded-xl bg-surface-secondary/70 border border-outline/20
                   overflow-hidden transition-all duration-200
                   hover:border-outline/40 hover:bg-surface-secondary
                   hover:shadow-[0_2px_16px_rgba(0,107,107,0.08)]
                   flex flex-col cursor-pointer group block h-full no-underline"
      >
        {product.image && (
          <div className="bg-surface-tertiary/40 p-3 flex justify-center relative">
            <img
              src={product.image}
              alt={product.name}
              className="h-[60px] object-contain group-hover:scale-[1.03]
                         transition-transform duration-300"
              onError={(e) => { e.target.parentElement.style.display = 'none' }}
            />
            {url && (
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100
                              transition-opacity duration-200">
                <ExternalLink size={10} className="text-onSurface-quaternary" />
              </div>
            )}
          </div>
        )}

        <div className="px-2.5 pt-2 pb-1.5 flex-1">
          <h4 className="text-[12px] font-medium text-onSurface-secondary font-inter leading-snug
                         group-hover:text-onSurface-primary transition-colors duration-200">
            {product.name}
          </h4>
          <p className="text-[10px] text-onSurface-quaternary/70 font-inter mt-0.5 leading-snug">
            {product.brand}{product.category ? ` · ${product.category}` : ''}
          </p>
        </div>

        <div className="flex items-center justify-between px-2.5 py-1.5 mt-auto
                        border-t border-outline/10">
          <span className="text-[12px] font-semibold text-highlight/80 font-inter">
            {formatPrice(product.price)}
          </span>
          {product.in_stock && (
            <span className="text-[9px] text-onSurface-quaternary/50 font-inter">
              In Stock
            </span>
          )}
        </div>
      </Tag>
    </motion.div>
  )
}
