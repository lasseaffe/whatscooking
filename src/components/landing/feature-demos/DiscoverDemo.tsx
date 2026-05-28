'use client'
import { useEffect, useState } from 'react'

// Mirrors discover-client.tsx: cuisine filter chips + 2×2 recipe card grid.
// Active chip: ember bg/border, cards fade in on chip select.

const CHIPS = ['All', 'Japanese', 'Italian', 'Moroccan', 'Mexican']

const RECIPE_SETS: Record<string, { title: string; cuisine: string; time: string; image: string }[]> = {
  All: [
    { title: 'Birria Tacos', cuisine: 'Mexican', time: '75 min', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=70' },
    { title: 'Tonkotsu Ramen', cuisine: 'Japanese', time: '13 hr', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&q=70' },
    { title: 'Butter Croissant', cuisine: 'French', time: '9 hr', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&q=70' },
    { title: 'Fattoush Salad', cuisine: 'Lebanese', time: '20 min', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=70' },
  ],
  Japanese: [
    { title: 'Tonkotsu Ramen', cuisine: 'Japanese', time: '13 hr', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&q=70' },
    { title: 'Salmon Nigiri', cuisine: 'Japanese', time: '40 min', image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=200&q=70' },
    { title: 'Miso Soup', cuisine: 'Japanese', time: '15 min', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&q=70' },
    { title: 'Gyoza', cuisine: 'Japanese', time: '30 min', image: 'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=200&q=70' },
  ],
  Italian: [
    { title: 'Cacio e Pepe', cuisine: 'Italian', time: '20 min', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&q=70' },
    { title: 'Margherita Pizza', cuisine: 'Italian', time: '45 min', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=70' },
    { title: 'Tiramisu', cuisine: 'Italian', time: '30 min', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&q=70' },
    { title: 'Focaccia', cuisine: 'Italian', time: '3 hr', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=70' },
  ],
  Moroccan: [
    { title: 'Lamb Tagine', cuisine: 'Moroccan', time: '2.5 hr', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=70' },
    { title: 'Fattoush Salad', cuisine: 'Lebanese', time: '20 min', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=70' },
    { title: 'Shakshuka', cuisine: 'Moroccan', time: '25 min', image: 'https://images.unsplash.com/photo-1591299177061-2151e53fcaea?w=200&q=70' },
    { title: 'Harissa Chicken', cuisine: 'Moroccan', time: '50 min', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=70' },
  ],
  Mexican: [
    { title: 'Birria Tacos', cuisine: 'Mexican', time: '75 min', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=70' },
    { title: 'Guacamole', cuisine: 'Mexican', time: '10 min', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&q=70' },
    { title: 'Enchiladas', cuisine: 'Mexican', time: '55 min', image: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=200&q=70' },
    { title: 'Churros', cuisine: 'Mexican', time: '35 min', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=70' },
  ],
}

const CYCLE = ['All', 'Japanese', 'Italian', 'Moroccan', 'Mexican']

export function DiscoverDemo() {
  const [activeChip, setActiveChip] = useState('All')
  const [cardsVisible, setCardsVisible] = useState(true)
  const [cycleIdx, setCycleIdx] = useState(0)

  // Auto-cycle chips every 2.5s
  useEffect(() => {
    const t = setTimeout(() => {
      setCardsVisible(false)
      setTimeout(() => {
        const next = (cycleIdx + 1) % CYCLE.length
        setCycleIdx(next)
        setActiveChip(CYCLE[next])
        setCardsVisible(true)
      }, 250)
    }, 2500)
    return () => clearTimeout(t)
  }, [cycleIdx])

  const recipes = RECIPE_SETS[activeChip] ?? RECIPE_SETS.All

  return (
    <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Filter chips — mirrors FilterBar */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'hidden', flexWrap: 'nowrap' }}>
        {CHIPS.map(chip => {
          const isActive = chip === activeChip
          return (
            <div
              key={chip}
              style={{
                padding: '4px 11px',
                borderRadius: 20,
                fontSize: 10,
                letterSpacing: 0.5,
                flexShrink: 0,
                background: isActive ? 'rgba(200,82,42,0.15)' : 'rgba(239,227,206,0.05)',
                border: `1px solid ${isActive ? 'rgba(200,82,42,0.4)' : 'rgba(239,227,206,0.12)'}`,
                color: isActive ? '#C8522A' : 'rgba(239,227,206,0.45)',
                transition: 'all 200ms ease',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {chip}
            </div>
          )
        })}
      </div>

      {/* 2×2 recipe card grid — mirrors RecipeCard in grid view */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        opacity: cardsVisible ? 1 : 0,
        transition: 'opacity 250ms ease',
      }}>
        {recipes.map((recipe, i) => (
          <div
            key={`${activeChip}-${i}`}
            style={{
              background: '#1C1209',
              border: '1px solid #3A2416',
              borderRadius: 10,
              overflow: 'hidden',
              transform: cardsVisible ? 'translateY(0)' : 'translateY(6px)',
              transition: `opacity 250ms ease ${i * 50}ms, transform 250ms ease ${i * 50}ms`,
            }}
          >
            <div style={{ height: 70, position: 'relative', overflow: 'hidden' }}>
              <img
                src={recipe.image}
                alt={recipe.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85) saturate(0.9)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
            </div>
            <div style={{ padding: '7px 9px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#EFE3CE', lineHeight: 1.3, marginBottom: 3 }}>{recipe.title}</div>
              <div style={{ fontSize: 9, color: '#6B4E36', letterSpacing: 0.5 }}>{recipe.cuisine.toUpperCase()} · {recipe.time}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
