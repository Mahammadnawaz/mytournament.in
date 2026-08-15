/**
 * Duckworth-Lewis-Stern (DLS) Method Engine for T20 & Limited Overs Cricket
 */

// Standard DLS Resource percentages per wickets lost & overs remaining
// Wickets Lost: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
const DLS_RESOURCE_WEIGHTS = [1.0, 0.93, 0.85, 0.74, 0.61, 0.47, 0.33, 0.20, 0.10, 0.04];

/**
 * Calculates remaining resource percentage (0-100%) for a team given overs remaining and wickets lost
 */
export function calculateDLSResourcePercentage(
  oversRemaining: number,
  totalMatchOvers: number,
  wicketsLost: number
): number {
  if (totalMatchOvers <= 0) return 100;
  const clampedWickets = Math.min(9, Math.max(0, wicketsLost));
  const weight = DLS_RESOURCE_WEIGHTS[clampedWickets];
  
  const oversFraction = Math.min(1, Math.max(0, oversRemaining / totalMatchOvers));
  // Non-linear resource decay exponential curve
  const resourcePct = weight * (1 - Math.exp(-2.2 * oversFraction)) * 100 / (1 - Math.exp(-2.2));
  return Math.min(100, Math.max(0, Number(resourcePct.toFixed(1))));
}

/**
 * Calculates DLS Par Score during 2nd Innings run-chase at any given point
 * @param innings1Total Runs scored by Team 1 in Innings 1
 * @param totalOvers Match original total overs
 * @param oversBowled Innings 2 current overs bowled (e.g. 3.4 ov -> 3 + 4/6 = 3.666)
 * @param wicketsLost Innings 2 current wickets lost
 */
export function calculateDLSParScore(
  innings1Total: number,
  totalOvers: number,
  oversBowled: number,
  wicketsLost: number
): { parScore: number; statusMessage: string; isAhead: boolean } {
  if (oversBowled <= 0) {
    return { parScore: 0, statusMessage: 'Match just started', isAhead: true };
  }

  const oversRemaining = Math.max(0, totalOvers - oversBowled);
  const team2Resources = calculateDLSResourcePercentage(oversRemaining, totalOvers, wicketsLost);
  
  // Standard DLS Par Score Formula: Par = Innings1Runs * (Team2ResourcesAvailable / 100)
  const parScore = Math.floor((innings1Total * (100 - team2Resources)) / 100) + 1;

  return {
    parScore: Math.max(0, parScore),
    statusMessage: `DLS Par Score: ${parScore}`,
    isAhead: true,
  };
}

/**
 * Calculates Revised DLS Target when overs are reduced due to rain
 */
export function calculateDLSRevisedTarget(
  innings1Total: number,
  originalOvers: number,
  revisedOvers: number,
  innings1WicketsLost: number = 0
): { revisedTarget: number; G50: number } {
  const G50 = 245; // Average T20/ODI total score constant

  const R1 = calculateDLSResourcePercentage(originalOvers, originalOvers, innings1WicketsLost);
  const R2 = calculateDLSResourcePercentage(revisedOvers, originalOvers, 0);

  let revisedTarget = innings1Total + 1;

  if (R2 < R1) {
    // Rain reduced Team 2 resources
    revisedTarget = Math.floor(innings1Total * (R2 / R1)) + 1;
  } else if (R2 > R1) {
    // Team 2 has more resources ratio
    revisedTarget = Math.floor(innings1Total + (G50 * (R2 - R1)) / 100) + 1;
  }

  return {
    revisedTarget: Math.max(1, revisedTarget),
    G50,
  };
}
