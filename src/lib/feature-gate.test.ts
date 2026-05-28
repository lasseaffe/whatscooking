import { checkFeatureGate, logFeatureUsage } from './feature-gate'

// Mock Supabase client
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })),
        }
      }
      if (table === 'ai_usage_log') {
        return {
          select: mockSelect,
          insert: mockInsert,
        }
      }
    }),
  })),
}))

describe('checkFeatureGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: free user
    mockSingle.mockResolvedValue({ data: { tier: 'free', tier_expires_at: null }, error: null })
  })

  it('allows pro user with no usage check', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'pro', tier_expires_at: null }, error: null })

    const result = await checkFeatureGate('user-1', 'recipe_extract')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('throws when profile fetch fails (does not silently demote pro user)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'connection refused' } })

    await expect(checkFeatureGate('user-1', 'recipe_extract')).rejects.toThrow(
      'feature-gate: profile fetch failed: connection refused'
    )
  })

  it('throws when usage count query fails (does not fail open)', async () => {
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: null, error: { message: 'timeout' } }),
        }),
      }),
    })

    await expect(checkFeatureGate('user-1', 'recipe_extract')).rejects.toThrow(
      'feature-gate: usage count failed: timeout'
    )
  })

  it('allows free user under weekly limit', async () => {
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      }),
    })

    const result = await checkFeatureGate('user-1', 'recipe_extract')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it('blocks free user at weekly limit', async () => {
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      }),
    })

    const result = await checkFeatureGate('user-1', 'recipe_extract')

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('always blocks batch_import for free users', async () => {
    const result = await checkFeatureGate('user-1', 'batch_import')

    expect(result.allowed).toBe(false)
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('blocks expired pro user like a free user', async () => {
    mockSingle.mockResolvedValue({
      data: { tier: 'pro', tier_expires_at: new Date(Date.now() - 1000).toISOString() },
      error: null,
    })
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      }),
    })

    const result = await checkFeatureGate('user-1', 'recipe_extract')

    expect(result.allowed).toBe(false)
  })
})

describe('logFeatureUsage', () => {
  it('inserts a usage record', async () => {
    mockInsert.mockResolvedValue({ error: null })

    await logFeatureUsage('user-1', 'recipe_extract', { recipe_id: 'r-1' })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', feature: 'recipe_extract' })
    )
  })

  it('logs error when insert fails but does not throw', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'db error' } })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(logFeatureUsage('user-1', 'recipe_extract')).resolves.not.toThrow()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
