import { test, expect } from '@playwright/test'
import { detectAppIntent, detectImageIntent, detectAudioIntent, detectIntent, detectMultiIntent } from '../lib/intent-matcher'

test.describe('Intent Detection — Unit Tests', () => {
  test('make a calculator app → app', () => {
    expect(detectAppIntent('make a calculator app')).toBe(true)
    expect(detectIntent('make a calculator app').intent).toBe('app')
  })

  test('build a calculator → app', () => {
    expect(detectAppIntent('build a calculator')).toBe(true)
  })

  test('can you make a calculator app → app', () => {
    expect(detectAppIntent('can you make a calculator app')).toBe(true)
  })

  test('create a todo list app → app', () => {
    expect(detectAppIntent('create a todo list app')).toBe(true)
  })

  test('build a sudoku game → app', () => {
    expect(detectAppIntent('build a sudoku game')).toBe(true)
  })

  test('draw a cat → image', () => {
    expect(detectImageIntent('draw a cat')).toBe(true)
    expect(detectIntent('draw a cat').intent).toBe('image')
  })

  test('show me a sunset → image', () => {
    expect(detectImageIntent('show me a sunset')).toBe(true)
  })

  test('generate an image of a dog → image', () => {
    expect(detectImageIntent('generate an image of a dog')).toBe(true)
  })

  test('text to speech hello → audio', () => {
    expect(detectAudioIntent('text to speech hello')).toBe(true)
    expect(detectIntent('text to speech hello').intent).toBe('audio')
  })

  test('convert text to speech → audio', () => {
    expect(detectAudioIntent('convert text to speech')).toBe(true)
  })

  test('show me a calculator → image (show me overrides)', () => {
    expect(detectImageIntent('show me a calculator')).toBe(true)
    expect(detectIntent('show me a calculator').intent).toBe('image')
  })

  test('hello → text (no intent)', () => {
    expect(detectIntent('hello').intent).toBe('text')
  })

  test('how are you → text (no intent)', () => {
    expect(detectIntent('how are you').intent).toBe('text')
  })

  test('confidence for phrase match >= 0.8', () => {
    const result = detectIntent('make a calculator app')
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
  })

  test('case insensitive: "Make A Calculator App"', () => {
    expect(detectAppIntent('Make A Calculator App')).toBe(true)
  })

  test('extra words: "please make a calculator app for me"', () => {
    expect(detectAppIntent('please make a calculator app for me')).toBe(true)
  })

  test('create a calculator → app (not image)', () => {
    expect(detectAppIntent('create a calculator')).toBe(true)
    expect(detectIntent('create a calculator').intent).toBe('app')
  })

  test('create a picture → image (not app)', () => {
    expect(detectImageIntent('create a picture')).toBe(true)
    expect(detectIntent('create a picture').intent).toBe('image')
  })

  test('app + audio: "build a game and make music" → app', () => {
    expect(detectIntent('build a game and make music').intent).toBe('app')
  })

  test('image + audio: "draw a cat and generate audio" → ambiguous', () => {
    const result = detectIntent('draw a cat and generate audio')
    // "generate audio" matches audio (priority 10), "draw a cat" matches image (priority 8)
    // image+audio conflict → text (ambiguous)
    expect(result.intent).toBe('text')
    expect(result.asksClarification).toBe(true)
  })
})
