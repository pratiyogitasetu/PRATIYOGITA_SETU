// Centralized search + answer-generation settings used by chat.
// Update these values (or corresponding VITE_* env vars) to tune behavior.

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const SEARCH_SETTINGS = {
  // RAG retrieval context size
  nResults: toNumber(import.meta.env.VITE_SEARCH_N_RESULTS, 5),

  // PYQ matching controls
  // Threshold range: 0.0 to 1.0
  mcqThreshold: toNumber(import.meta.env.VITE_MCQ_THRESHOLD, 0.65),
  // 0 means "no hard limit" (return all matches above threshold)
  mcqLimit: toNumber(import.meta.env.VITE_MCQ_LIMIT, 20),

  // Answer-generation controls (forwarded to backend)
  answerGeneration: {
    temperature: toNumber(import.meta.env.VITE_ANSWER_TEMPERATURE, 0.3),
    topP: toNumber(import.meta.env.VITE_ANSWER_TOP_P, 0.9),
    maxTokens: toNumber(import.meta.env.VITE_ANSWER_MAX_TOKENS, 1500)
  }
}
