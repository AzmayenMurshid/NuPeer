/**
 * Projection utilities for academic analytics
 * Provides dynamic trend-based projections for GPA, points, and credits
 */

export interface ProjectionConfig {
  /** Number of future periods to project */
  periods?: number
  /** Number of recent data points to use for trend calculation */
  lookbackPeriods?: number
  /** Minimum data points required for projection */
  minDataPoints?: number
  /** Method to use for projection */
  method?: 'linear' | 'moving_average' | 'exponential'
  /** Value constraints */
  constraints?: {
    min?: number
    max?: number
  }
  /** Whether to preserve related fields (e.g., credits for points trend) */
  preserveRelatedFields?: boolean
}

export interface DataPoint {
  period: string
  [key: string]: any
}

/**
 * Calculate linear regression trend from data points
 */
function calculateLinearRegression(
  data: DataPoint[],
  valueKey: string,
  lookbackPeriods: number
): { slope: number; intercept: number } {
  const recentData = data.slice(-lookbackPeriods)
  
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  const n = recentData.length
  
  recentData.forEach((point, index) => {
    const x = index
    const y = point[valueKey] || 0
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return { slope, intercept }
}

/**
 * Calculate moving average trend
 */
function calculateMovingAverage(
  data: DataPoint[],
  valueKey: string,
  lookbackPeriods: number
): number {
  const recentData = data.slice(-lookbackPeriods)
  const sum = recentData.reduce((acc, point) => acc + (point[valueKey] || 0), 0)
  return sum / recentData.length
}

/**
 * Calculate exponential smoothing trend
 */
function calculateExponentialSmoothing(
  data: DataPoint[],
  valueKey: string,
  lookbackPeriods: number,
  alpha: number = 0.3
): number {
  const recentData = data.slice(-lookbackPeriods)
  if (recentData.length === 0) return 0
  
  let smoothed = recentData[0][valueKey] || 0
  for (let i = 1; i < recentData.length; i++) {
    smoothed = alpha * (recentData[i][valueKey] || 0) + (1 - alpha) * smoothed
  }
  
  return smoothed
}

/**
 * Parse period string to extract semester and year
 */
function parsePeriod(period: string): { semester: string; year: number } | null {
  const match = period.match(/(\w+)\s+(\d{4})/)
  if (!match) return null
  
  return {
    semester: match[1],
    year: parseInt(match[2])
  }
}

/**
 * Generate next period from current semester and year
 * Uses academic calendar order: Fall, Spring, Summer
 */
function getNextPeriod(
  currentSemester: string,
  currentYear: number,
  semesterOrder: string[] = ['Fall', 'Spring', 'Summer', 'Winter']
): { semester: string; year: number } {
  const currentIndex = semesterOrder.indexOf(currentSemester)
  let nextIndex = currentIndex + 1
  let nextYear = currentYear
  
  // Academic calendar: After Summer, go to Fall of next year
  if (nextIndex >= semesterOrder.length || currentSemester === 'Summer') {
    // If we're at the end or it's Summer, next is Fall of next year
    if (currentSemester === 'Summer') {
      return {
        semester: 'Fall',
        year: currentYear + 1
      }
    }
    // Otherwise wrap to first semester of next year
    nextIndex = 0
    nextYear++
  }
  
  return {
    semester: semesterOrder[nextIndex],
    year: nextYear
  }
}

/**
 * Apply constraints to a projected value
 */
function applyConstraints(
  value: number,
  constraints?: { min?: number; max?: number }
): number {
  let constrained = value
  
  if (constraints?.min !== undefined) {
    constrained = Math.max(constraints.min, constrained)
  }
  
  if (constraints?.max !== undefined) {
    constrained = Math.min(constraints.max, constrained)
  }
  
  return constrained
}

/**
 * Calculate projected value based on method
 */
function calculateProjectedValue(
  data: DataPoint[],
  valueKey: string,
  method: string,
  lookbackPeriods: number,
  projectionIndex: number
): number {
  switch (method) {
    case 'linear': {
      const { slope, intercept } = calculateLinearRegression(data, valueKey, lookbackPeriods)
      return slope * (data.length + projectionIndex - 1) + intercept
    }
    
    case 'moving_average': {
      const avg = calculateMovingAverage(data, valueKey, lookbackPeriods)
      return avg
    }
    
    case 'exponential': {
      const smoothed = calculateExponentialSmoothing(data, valueKey, lookbackPeriods)
      return smoothed
    }
    
    default:
      return 0
  }
}

/**
 * Generate projected data points based on trend analysis
 * 
 * @param data - Array of data points with period and value fields
 * @param valueKey - Key to extract value from (e.g., 'gpa', 'points')
 * @param config - Configuration options for projection
 * @returns Array of data points including original data plus projections
 */
export function calculateProjection(
  data: DataPoint[],
  valueKey: string,
  config: ProjectionConfig = {}
): DataPoint[] {
  const {
    periods = 4,
    lookbackPeriods = 6,
    minDataPoints = 2,
    method = 'linear',
    constraints,
    preserveRelatedFields = false
  } = config
  
  // Validate input
  if (!data || data.length < minDataPoints) {
    return data
  }
  
  // Get the last period to project from
  const lastDataPoint = data[data.length - 1]
  const periodInfo = parsePeriod(lastDataPoint.period)
  
  if (!periodInfo) {
    return data
  }
  
  const { semester: lastSemester, year: lastYear } = periodInfo
  // Academic calendar order: Fall, Spring, Summer
  const semesterOrder = ['Fall', 'Spring', 'Summer', 'Winter']
  
  // Create a set of existing periods to avoid duplicates
  const existingPeriods = new Set(data.map(d => d.period))
  
  // Generate projected periods
  const projectedData: DataPoint[] = []
  let currentSemester = lastSemester
  let currentYear = lastYear
  
  for (let i = 0; i < periods; i++) {
    // Get next period
    const nextPeriod = getNextPeriod(currentSemester, currentYear, semesterOrder)
    currentSemester = nextPeriod.semester
    currentYear = nextPeriod.year
    
    const period = `${currentSemester} ${currentYear}`
    
    // Skip if this period already exists in the data (avoid duplicates)
    if (existingPeriods.has(period)) {
      // Move to next period and continue
      const skipPeriod = getNextPeriod(currentSemester, currentYear, semesterOrder)
      currentSemester = skipPeriod.semester
      currentYear = skipPeriod.year
      continue
    }
    
    // Mark this period as seen
    existingPeriods.add(period)
    
    // Calculate projected value
    const rawValue = calculateProjectedValue(data, valueKey, method, lookbackPeriods, i)
    const constrainedValue = applyConstraints(rawValue, constraints)
    // Round to 2 decimal places
    const projectedValue = Math.round(constrainedValue * 100) / 100
    
    // Create projected data point
    const projectedPoint: DataPoint = {
      period,
      [valueKey]: projectedValue,
      isProjected: true
    }
    
    // Preserve related fields if requested (e.g., credits for points trend)
    if (preserveRelatedFields && lastDataPoint) {
      const relatedFields = ['credits', 'attempted_credits', 'earned_credits', 'course_count']
      relatedFields.forEach(field => {
        if (lastDataPoint[field] !== undefined) {
          projectedPoint[field] = lastDataPoint[field]
        }
      })
    }
    
    projectedData.push(projectedPoint)
  }
  
  return [...data, ...projectedData]
}

/**
 * Pre-configured projection functions for common use cases
 */
export const projectionPresets = {
  /**
   * GPA projection with constraints (0-4.0)
   */
  gpa: (data: DataPoint[], config?: Partial<ProjectionConfig>) => {
    return calculateProjection(data, 'gpa', {
      periods: 4,
      lookbackPeriods: 6,
      method: 'linear',
      constraints: { min: 0, max: 4.0 },
      ...config
    })
  },
  
  /**
   * Points projection (non-negative)
   */
  points: (data: DataPoint[], config?: Partial<ProjectionConfig>) => {
    return calculateProjection(data, 'points', {
      periods: 4,
      lookbackPeriods: 6,
      method: 'linear',
      constraints: { min: 0 },
      preserveRelatedFields: true,
      ...config
    })
  },
  
  /**
   * Credits projection
   */
  credits: (data: DataPoint[], config?: Partial<ProjectionConfig>) => {
    return calculateProjection(data, 'credits', {
      periods: 4,
      lookbackPeriods: 6,
      method: 'moving_average',
      constraints: { min: 0 },
      ...config
    })
  }
}

