import { z } from 'zod'

export const songSchema = z.object({
  id: z.string().trim().min(1),
  song: z.string().trim().min(1),
  artist: z.string().trim().min(1),
  key: z.string().trim().min(1),
  bpm: z.number().int().positive().max(400),
  length: z.string().regex(/^\d+:\d{2}$/),
  durationSec: z.number().int().positive(),
  twoGuitars: z.boolean(),
  tuning: z.string().trim().min(1),
  bassTuning: z.string().trim(),
  weight: z.number().int().min(1).max(4),
  genre: z.string().trim().min(1),
  vocalDifficulty: z.number().int().min(1).max(5),
  energyRating: z.number().int().min(1).max(5),
  opener: z.boolean(),
  closer: z.boolean(),
  encore: z.boolean(),
  encoreOnly: z.boolean(),
})

/** @typedef {z.infer<typeof songSchema>} Song */
