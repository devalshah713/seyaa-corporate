import { METAL_SWATCHES, type Variant } from '@/lib/catalogue'

/** The metal colours a design is offered in, as small swatches. */
export default function MetalDots({ colours }: { colours: Variant['metalColour'][] }) {
  if (!colours.length) return null
  return (
    <span className="flex items-center gap-1.5" aria-label={`Available in ${colours.join(', ')} gold`}>
      {colours.map((colour) => (
        <span
          key={colour}
          title={`${colour} gold`}
          className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/25"
          style={{ background: METAL_SWATCHES[colour] ?? '#999' }}
        />
      ))}
    </span>
  )
}
