export const TOTAL_MEDALS = 75

// Medal count each Medal Box stage starts at. Stage 7 needs every medal.
const STAGE_STARTS = [0, 5, 15, 30, 45, 60, TOTAL_MEDALS]

export function medalStage(count) {
  return STAGE_STARTS.findLastIndex(start => count >= start) + 1
}
