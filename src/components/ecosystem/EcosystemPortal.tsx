import type { EcosystemPortalState } from '@/lib/ecosystem'

interface Props {
  portalState: EcosystemPortalState
  growableIngredients: string[]
  tillrAppUrl?: string
}

export function EcosystemPortal({ portalState, growableIngredients, tillrAppUrl = 'https://tillr.app' }: Props) {
  const { state, matchData } = portalState
  const primaryIngredient = growableIngredients[0] ?? 'herbs'

  const header = (
    <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: '#ece4d0' }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#2d6a2d' }} />
      <span className="font-mono text-[9px] tracking-[2px] uppercase" style={{ color: '#6b5a48' }}>
        Tillr Garden
      </span>
      {state !== 'not-linked' && (
        <span className="ml-auto font-mono text-[8px]" style={{ color: '#2d6a2d' }}>● live</span>
      )}
      {state === 'not-linked' && (
        <span className="ml-auto font-mono text-[8px]" style={{ color: '#9a8878' }}>○ not linked</span>
      )}
    </div>
  )

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ border: '1.5px solid #c0a878' }}
    >
      {header}
      <div className="px-3.5 py-3" style={{ background: '#faf5ec' }}>

        {state === 'match' && matchData?.harvestedAt && matchData.daysUntilHarvest === 0 && (
          <>
            <p className="font-serif text-sm font-semibold mb-0.5" style={{ color: '#2c1f0e' }}>
              Harvested this morning
            </p>
            <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#6b5a48' }}>
              {matchData.plantName && (
                <span className="inline-block font-mono text-[8px] px-1.5 py-0.5 rounded-full mr-1"
                  style={{ background: 'rgba(45,106,45,0.12)', color: '#7cb97c', border: '1px solid rgba(45,106,45,0.25)' }}>
                  {matchData.plantName}
                </span>
              )}
              {matchData.grams ? `${matchData.grams}g` : 'Fresh harvest'} is ready — perfect for this recipe.
            </p>
            <a
              href={`${tillrAppUrl}/plants/${matchData.plantId ?? ''}`}
              className="inline-block text-[11px] font-semibold px-3 py-1 rounded-md"
              style={{ background: '#2d6a2d', color: '#faf5ec' }}
            >
              View garden →
            </a>
          </>
        )}

        {state === 'match' && (matchData?.daysUntilHarvest ?? 0) > 0 && (
          <>
            <p className="font-serif text-sm font-semibold mb-0.5" style={{ color: '#2c1f0e' }}>
              {matchData?.plantName ?? capitalize(primaryIngredient)} — harvest in {matchData?.daysUntilHarvest} day{matchData?.daysUntilHarvest === 1 ? '' : 's'}
            </p>
            <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#6b5a48' }}>
              <span className="inline-block font-mono text-[8px] px-1.5 py-0.5 rounded-full mr-1"
                style={{ background: 'rgba(45,106,45,0.12)', color: '#7cb97c', border: '1px solid rgba(45,106,45,0.25)' }}>
                {matchData?.daysUntilHarvest}d
              </span>
              Plan this recipe for then and use your own {primaryIngredient}.
            </p>
            <a
              href={`${tillrAppUrl}/plants/${matchData?.plantId ?? ''}`}
              className="inline-block text-[11px] font-semibold px-3 py-1 rounded-md"
              style={{ background: '#2d6a2d', color: '#faf5ec' }}
            >
              Reschedule meal →
            </a>
          </>
        )}

        {state === 'no-match' && (
          <>
            <p className="font-serif text-sm font-semibold mb-0.5" style={{ color: '#2c1f0e' }}>
              Grow your own {primaryIngredient}
            </p>
            <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#6b5a48' }}>
              Track {growableIngredients.slice(0, 3).join(', ')} in Tillr. Know exactly when to harvest before you cook.
            </p>
            <a
              href={`${tillrAppUrl}/species?search=${primaryIngredient}`}
              className="inline-block text-[11px] font-semibold px-3 py-1 rounded-md"
              style={{ background: '#2d6a2d', color: '#faf5ec' }}
            >
              Start growing →
            </a>
          </>
        )}

        {state === 'not-linked' && (
          <>
            <p className="font-serif text-sm font-semibold mb-0.5" style={{ color: '#2c1f0e' }}>
              Grow the {primaryIngredient} in this recipe
            </p>
            <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#6b5a48' }}>
              Never buy supermarket {primaryIngredient} again. Track it in Tillr — harvest it fresh.
            </p>
            <div className="flex items-center gap-2">
              <a
                href={`${tillrAppUrl}/signup`}
                className="inline-block text-[11px] font-semibold px-3 py-1 rounded-md"
                style={{ background: '#2d6a2d', color: '#faf5ec' }}
              >
                Try Tillr →
              </a>
              <a
                href="/settings#ecosystem"
                className="inline-block text-[11px] px-3 py-1 rounded-md"
                style={{ border: '1px solid #c0a878', color: '#9a8878' }}
              >
                Connect
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
