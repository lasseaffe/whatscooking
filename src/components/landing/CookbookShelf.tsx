import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CookbookCard } from './CookbookCards'

function GhostCard() {
  return (
    <div style={{
      width: 220,
      height: 300,
      flexShrink: 0,
      background: 'rgba(244,162,97,0.04)',
      border: '1px solid rgba(244,162,97,0.08)',
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {[40, 70, 90].map((top) => (
        <div key={top} style={{
          position: 'absolute',
          left: 16, right: 16,
          top,
          height: 8,
          background: 'rgba(244,162,97,0.06)',
          borderRadius: 2,
        }} />
      ))}
    </div>
  )
}

export async function CookbookShelf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <section style={{ background: '#0a0503', padding: '80px 40px', borderTop: '1px solid rgba(244,162,97,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: 4, color: 'rgba(244,162,97,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>
          Your Cookbooks
        </p>
        <h2 style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 400, color: 'rgba(239,227,206,0.9)', marginBottom: 40, margin: '0 0 40px' }}>
          Build your cookbook
        </h2>
        <div style={{ position: 'relative', display: 'inline-flex', gap: 12 }}>
          <GhostCard />
          <GhostCard />
          <GhostCard />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, transparent 10%, rgba(10,5,3,0.85) 60%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 32,
          }}>
            <Link href="/auth/login" style={{
              display: 'inline-block',
              fontSize: 11,
              letterSpacing: 2,
              color: 'rgba(239,227,206,0.9)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              background: '#8B2635',
              padding: '10px 20px',
              borderRadius: 2,
            }}>
              Sign in to continue
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const { data: cookbooks } = await supabase
    .from('cookbooks')
    .select('id, title, slug, cover_image_url, theme_color, cookbook_chapters(cookbook_recipes(id))')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3)

  const withCounts = (cookbooks ?? []).map((cb) => ({
    ...cb,
    recipeCount: (cb.cookbook_chapters ?? []).reduce(
      (acc: number, ch: { cookbook_recipes: { id: string }[] }) => acc + (ch.cookbook_recipes?.length ?? 0),
      0
    ),
  }))

  return (
    <section style={{ background: '#0a0503', padding: '80px 40px', borderTop: '1px solid rgba(244,162,97,0.06)' }}>
      <p style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: 4, color: 'rgba(244,162,97,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>
        Your Cookbooks
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 400, color: 'rgba(239,227,206,0.9)', margin: 0 }}>
          Your Cookbooks
        </h2>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/cookbooks" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(244,162,97,0.7)', textDecoration: 'none', textTransform: 'uppercase' }}>
            View All
          </Link>
          <Link href="/cookbooks/new" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.5)', textDecoration: 'none', textTransform: 'uppercase' }}>
            + Create New
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {withCounts.map((cb) => (
          <CookbookCard
            key={cb.id}
            href={`/cookbooks/${cb.slug}`}
            title={cb.title}
            count={cb.recipeCount}
            accent={cb.theme_color ?? '#8B2635'}
            coverImageUrl={cb.cover_image_url}
          />
        ))}
        {withCounts.length === 0 && (
          <Link href="/cookbooks/new" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 220,
            height: 300,
            border: '1px dashed rgba(244,162,97,0.2)',
            borderRadius: 2,
            fontSize: 11,
            letterSpacing: 2,
            color: 'rgba(244,162,97,0.5)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            + Create First Cookbook
          </Link>
        )}
      </div>
    </section>
  )
}
