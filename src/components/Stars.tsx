import { StarIcon } from './Icons'

interface Props {
  value: number
  size?: number
  className?: string
}

export function Stars({ value, size = 11, className = '' }: Props) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className={`inline-flex items-center gap-[2px] text-amber-400 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <StarIcon className="absolute inset-0 text-current opacity-25" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarIcon className="text-current" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
