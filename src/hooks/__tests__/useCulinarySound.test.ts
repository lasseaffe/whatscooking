import { renderHook, act } from '@testing-library/react'

// Mock AudioContext since jsdom doesn't support Web Audio API
const mockOscillator = {
  type: 'sine',
  frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}
const mockGain = {
  gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
  connect: jest.fn(),
}
const mockBuffer = { getChannelData: jest.fn(() => new Float32Array(0)) }
const mockBufferSource = { buffer: null, connect: jest.fn(), start: jest.fn() }
const mockFilter = { type: '', frequency: { value: 0 }, connect: jest.fn() }
const mockCtx = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGain),
  createBuffer: jest.fn(() => mockBuffer),
  createBufferSource: jest.fn(() => mockBufferSource),
  createBiquadFilter: jest.fn(() => mockFilter),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  state: 'running',
  resume: jest.fn(() => Promise.resolve()),
}
global.AudioContext = jest.fn(() => mockCtx) as unknown as typeof AudioContext

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})

test('muted defaults to false', async () => {
  const { useCulinarySound } = await import('../useCulinarySound')
  const { result } = renderHook(() => useCulinarySound())
  expect(result.current.muted).toBe(false)
})

test('toggleMute flips muted state', async () => {
  const { useCulinarySound } = await import('../useCulinarySound')
  const { result } = renderHook(() => useCulinarySound())
  act(() => result.current.toggleMute())
  expect(result.current.muted).toBe(true)
})

test('mute state persists to localStorage', async () => {
  const { useCulinarySound } = await import('../useCulinarySound')
  const { result } = renderHook(() => useCulinarySound())
  act(() => result.current.toggleMute())
  expect(localStorage.getItem('wc-sound-muted')).toBe('true')
})

test('loads mute state from localStorage on init', async () => {
  localStorage.setItem('wc-sound-muted', 'true')
  const { useCulinarySound } = await import('../useCulinarySound')
  const { result } = renderHook(() => useCulinarySound())
  expect(result.current.muted).toBe(true)
})

test('play does not throw when muted', async () => {
  const { useCulinarySound } = await import('../useCulinarySound')
  const { result } = renderHook(() => useCulinarySound())
  act(() => result.current.toggleMute())
  expect(() => result.current.play('ceramic-tap')).not.toThrow()
})
