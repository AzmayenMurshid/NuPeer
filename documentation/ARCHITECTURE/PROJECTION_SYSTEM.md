# Projection System Documentation

## Overview

The projection system provides dynamic trend-based forecasting for academic analytics data. It analyzes historical trends from transcript data and projects future values for GPA, points, credits, and other academic metrics.

**Location:** `frontend/lib/utils/projections.ts`

## Purpose

The projection system enables users to:
- Visualize predicted future academic performance
- Understand trends in their academic progress
- Plan for upcoming semesters based on historical patterns
- Make data-driven decisions about course selection and study strategies

## Architecture

### Core Components

1. **Projection Engine** (`calculateProjection`)
   - Main function that generates projected data points
   - Configurable via `ProjectionConfig` interface
   - Supports multiple projection methods

2. **Trend Calculation Methods**
   - Linear Regression
   - Moving Average
   - Exponential Smoothing

3. **Preset Functions**
   - Pre-configured projections for common use cases
   - GPA, Points, and Credits projections

4. **Utility Functions**
   - Period parsing and generation
   - Value constraint application
   - Data validation

## Data Structures

### ProjectionConfig Interface

```typescript
interface ProjectionConfig {
  periods?: number                    // Number of future periods to project (default: 4)
  lookbackPeriods?: number            // Recent data points for trend calculation (default: 6)
  minDataPoints?: number              // Minimum data points required (default: 2)
  method?: 'linear' | 'moving_average' | 'exponential'  // Projection method
  constraints?: {
    min?: number                      // Minimum value constraint
    max?: number                      // Maximum value constraint
  }
  preserveRelatedFields?: boolean     // Preserve related fields (e.g., credits)
}
```

### DataPoint Interface

```typescript
interface DataPoint {
  period: string                      // Period identifier (e.g., "Fall 2024")
  [key: string]: any                 // Flexible data structure
  isProjected?: boolean              // Flag indicating projected data
}
```

## Projection Methods

### 1. Linear Regression

**Method:** `'linear'`

**How it works:**
- Calculates a linear trend line using least squares regression
- Uses the last N data points (configurable via `lookbackPeriods`)
- Projects future values by extending the trend line

**Formula:**
```
slope = (n * Σ(xy) - Σ(x) * Σ(y)) / (n * Σ(x²) - (Σ(x))²)
intercept = (Σ(y) - slope * Σ(x)) / n
projected_value = slope * (data_length + projection_index) + intercept
```

**Best for:**
- Data with clear linear trends
- GPA projections (typically stable trends)
- Long-term projections

**Example:**
```typescript
const projected = calculateProjection(data, 'gpa', {
  method: 'linear',
  lookbackPeriods: 6,
  periods: 4
})
```

### 2. Moving Average

**Method:** `'moving_average'`

**How it works:**
- Calculates the average of the last N data points
- Projects this average value forward for all future periods
- Assumes values will remain constant at the recent average

**Formula:**
```
average = Σ(recent_values) / n
projected_value = average
```

**Best for:**
- Stable, consistent data
- Credit projections (typically consistent semester-to-semester)
- Short-term projections

**Example:**
```typescript
const projected = calculateProjection(data, 'credits', {
  method: 'moving_average',
  lookbackPeriods: 4,
  periods: 4
})
```

### 3. Exponential Smoothing

**Method:** `'exponential'`

**How it works:**
- Applies exponential smoothing to recent data points
- Gives more weight to recent values
- Smooths out short-term fluctuations

**Formula:**
```
smoothed = α * current_value + (1 - α) * previous_smoothed
where α (alpha) = 0.3 (default smoothing factor)
```

**Best for:**
- Data with fluctuations
- Short-term projections
- When recent trends are more important than historical averages

**Example:**
```typescript
const projected = calculateProjection(data, 'points', {
  method: 'exponential',
  lookbackPeriods: 6,
  periods: 4
})
```

## Preset Functions

### GPA Projection

```typescript
projectionPresets.gpa(data, config?)
```

**Default Configuration:**
- Method: `'linear'`
- Periods: `4`
- Lookback Periods: `6`
- Constraints: `{ min: 0, max: 4.0 }`

**Usage:**
```typescript
import { projectionPresets } from '@/lib/utils/projections'

const gpaData = [
  { period: 'Fall 2023', gpa: 3.5 },
  { period: 'Spring 2024', gpa: 3.6 },
  { period: 'Fall 2024', gpa: 3.7 }
]

const projected = projectionPresets.gpa(gpaData)
// Returns data with 4 projected future semesters
```

### Points Projection

```typescript
projectionPresets.points(data, config?)
```

**Default Configuration:**
- Method: `'linear'`
- Periods: `4`
- Lookback Periods: `6`
- Constraints: `{ min: 0 }`
- Preserve Related Fields: `true` (preserves credits, attempted_credits, earned_credits)

**Usage:**
```typescript
const pointsData = [
  { period: 'Fall 2023', points: 45.5, credits: 15 },
  { period: 'Spring 2024', points: 48.2, credits: 15 }
]

const projected = projectionPresets.points(pointsData)
// Returns data with projected points and preserved credit values
```

### Credits Projection

```typescript
projectionPresets.credits(data, config?)
```

**Default Configuration:**
- Method: `'moving_average'`
- Periods: `4`
- Lookback Periods: `6`
- Constraints: `{ min: 0 }`

**Usage:**
```typescript
const creditsData = [
  { period: 'Fall 2023', credits: 15 },
  { period: 'Spring 2024', credits: 15 }
]

const projected = projectionPresets.credits(creditsData)
```

## Period Generation

### Semester Order

The system follows the standard academic semester order:
1. Spring
2. Summer
3. Fall
4. Winter

### Period Format

Periods are formatted as: `"{Semester} {Year}"`

**Examples:**
- `"Fall 2024"`
- `"Spring 2025"`
- `"Summer 2023"`

### Period Progression

The system automatically handles:
- Year transitions (Fall → Spring of next year)
- Semester wrapping (Winter → Spring)
- Leap years and calendar considerations

## Value Constraints

### Purpose

Constraints ensure projected values remain within realistic bounds:
- **GPA**: Clamped between 0.0 and 4.0
- **Points**: Ensured to be non-negative
- **Credits**: Ensured to be non-negative

### Implementation

```typescript
function applyConstraints(value: number, constraints?: { min?: number; max?: number }): number {
  let constrained = value
  
  if (constraints?.min !== undefined) {
    constrained = Math.max(constraints.min, constrained)
  }
  
  if (constraints?.max !== undefined) {
    constrained = Math.min(constraints.max, constrained)
  }
  
  return constrained
}
```

## Usage Examples

### Basic Usage

```typescript
import { calculateProjection } from '@/lib/utils/projections'

const data = [
  { period: 'Fall 2023', gpa: 3.5 },
  { period: 'Spring 2024', gpa: 3.6 },
  { period: 'Fall 2024', gpa: 3.7 }
]

const projected = calculateProjection(data, 'gpa', {
  periods: 4,
  method: 'linear',
  constraints: { min: 0, max: 4.0 }
})
```

### Custom Configuration

```typescript
import { calculateProjection } from '@/lib/utils/projections'

const projected = calculateProjection(data, 'points', {
  periods: 6,                    // Project 6 semesters ahead
  lookbackPeriods: 8,           // Use last 8 data points
  method: 'exponential',        // Use exponential smoothing
  constraints: { min: 0 },      // Ensure non-negative
  preserveRelatedFields: true   // Preserve credits fields
})
```

### Using Presets with Overrides

```typescript
import { projectionPresets } from '@/lib/utils/projections'

// Use GPA preset but override periods
const projected = projectionPresets.gpa(data, {
  periods: 8,  // Project 8 semesters instead of default 4
  method: 'exponential'  // Use different method
})
```

## Integration with Analytics Page

### Current Implementation

The projection system is integrated into the Analytics page (`frontend/app/analytics/page.tsx`):

```typescript
import { projectionPresets } from '@/lib/utils/projections'

// GPA Trend
const filteredGpaTrend = useMemo(() => {
  const filtered = filterByTime(displayAnalytics.gpa_trend || [], timeFilter, 'gpa')
  return showProjection ? projectionPresets.gpa(filtered) : filtered
}, [displayAnalytics.gpa_trend, timeFilter, filterByTime, showProjection])

// Points Trend
const filteredPointsTrend = useMemo(() => {
  const filtered = filterByTime(displayAnalytics.points_trend || [], timeFilter, 'points')
  return showProjection ? projectionPresets.points(filtered) : filtered
}, [displayAnalytics.points_trend, timeFilter, filterByTime, showProjection])
```

### UI Toggle

Users can enable/disable projections via a checkbox:
- Located next to time filter dropdowns
- Toggles `showProjection` state
- Updates graphs in real-time

## Visual Representation

### Projected Data Indicators

Projected data points are visually distinguished:

1. **Line Style:**
   - Actual data: Solid lines
   - Projected data: Dashed lines (`strokeDasharray="5 5"`)

2. **Dot Style:**
   - Actual data: Full opacity, larger dots (r=4-5)
   - Projected data: Reduced opacity (0.5-0.6), smaller dots (r=3)

3. **Legend:**
   - Separate legend entries for projected data
   - Labeled as "{Metric} (Projected)"

### Example Graph Structure

```
Actual Data:  [=====]  (solid line, full opacity)
Projected:    [-----]  (dashed line, reduced opacity)
```

## Validation and Error Handling

### Input Validation

1. **Minimum Data Points:**
   - Requires at least 2 data points (configurable via `minDataPoints`)
   - Returns original data if insufficient

2. **Period Format:**
   - Validates period string format: `"{Semester} {Year}"`
   - Returns original data if format is invalid

3. **Data Structure:**
   - Validates that data points contain required fields
   - Handles missing values gracefully (defaults to 0)

### Error Scenarios

```typescript
// Insufficient data
calculateProjection([], 'gpa')  // Returns []

// Invalid period format
calculateProjection([{ period: 'invalid' }], 'gpa')  // Returns original data

// Missing value key
calculateProjection([{ period: 'Fall 2024' }], 'gpa')  // Uses 0 as default
```

## Performance Considerations

### Optimization

1. **Memoization:**
   - Projections are calculated in `useMemo` hooks
   - Only recalculates when dependencies change

2. **Lookback Periods:**
   - Defaults to 6 periods (configurable)
   - Balances accuracy vs. performance

3. **Data Filtering:**
   - Filters out projected data when projection is disabled
   - Prevents unnecessary rendering

### Complexity

- **Time Complexity:** O(n) where n is the number of data points
- **Space Complexity:** O(n + p) where p is the number of projected periods

## Best Practices

### When to Use Each Method

1. **Linear Regression:**
   - Use for GPA projections (stable trends)
   - Use for long-term projections
   - Use when data shows clear linear pattern

2. **Moving Average:**
   - Use for credit projections (consistent values)
   - Use for short-term projections
   - Use when data is relatively stable

3. **Exponential Smoothing:**
   - Use when recent trends are more important
   - Use for data with fluctuations
   - Use for short-term projections

### Configuration Recommendations

1. **GPA Projections:**
   ```typescript
   {
     method: 'linear',
     lookbackPeriods: 6,
     periods: 4,
     constraints: { min: 0, max: 4.0 }
   }
   ```

2. **Points Projections:**
   ```typescript
   {
     method: 'linear',
     lookbackPeriods: 6,
     periods: 4,
     constraints: { min: 0 },
     preserveRelatedFields: true
   }
   ```

3. **Credits Projections:**
   ```typescript
   {
     method: 'moving_average',
     lookbackPeriods: 4,
     periods: 4,
     constraints: { min: 0 }
   }
   ```

## Limitations and Considerations

### Known Limitations

1. **Assumes Continuity:**
   - Projects assume current trends will continue
   - Doesn't account for external factors (life changes, course difficulty, etc.)

2. **Linear Assumptions:**
   - Linear regression assumes linear trends
   - May not capture non-linear patterns

3. **Historical Bias:**
   - Projections are based solely on historical data
   - Doesn't consider future course selections or changes in study habits

### When Projections May Be Inaccurate

1. **Insufficient Data:**
   - Less than 2-3 semesters of data
   - Large gaps in historical data

2. **Volatile Trends:**
   - Highly variable GPA/points
   - Inconsistent credit loads

3. **Major Changes:**
   - Change in major (different course difficulty)
   - Change in study habits
   - External life events

## Future Enhancements

### Potential Improvements

1. **Advanced Methods:**
   - Polynomial regression
   - Seasonal adjustments
   - Machine learning models

2. **Confidence Intervals:**
   - Show uncertainty ranges
   - Upper/lower bounds for projections

3. **Scenario Planning:**
   - "What-if" scenarios
   - Different projection paths based on assumptions

4. **User Customization:**
   - Allow users to adjust projection parameters
   - Custom projection methods
   - Manual override of projected values

## Testing

### Test Cases

1. **Basic Functionality:**
   - Project with sufficient data
   - Verify period generation
   - Verify value constraints

2. **Edge Cases:**
   - Insufficient data
   - Invalid period formats
   - Missing values

3. **Method Validation:**
   - Linear regression accuracy
   - Moving average calculation
   - Exponential smoothing

### Example Test

```typescript
describe('Projection System', () => {
  it('should project GPA correctly', () => {
    const data = [
      { period: 'Fall 2023', gpa: 3.5 },
      { period: 'Spring 2024', gpa: 3.6 },
      { period: 'Fall 2024', gpa: 3.7 }
    ]
    
    const projected = projectionPresets.gpa(data)
    
    expect(projected.length).toBe(7) // 3 original + 4 projected
    expect(projected[3].isProjected).toBe(true)
    expect(projected[3].gpa).toBeGreaterThanOrEqual(0)
    expect(projected[3].gpa).toBeLessThanOrEqual(4.0)
  })
})
```

## Related Documentation

- [Analytics Page Implementation](../frontend/app/analytics/page.tsx)
- [Academic Analytics API](../ARCHITECTURE/API_DESIGN.md)
- [Database Access Guide](../ARCHITECTURE/DATABASE_ACCESS_GUIDE.md)

## Summary

The projection system provides a flexible, configurable way to forecast academic performance based on historical trends. It supports multiple projection methods, customizable parameters, and is designed to be easily extensible for future enhancements.

**Key Takeaways:**
- ✅ Dynamic and configurable
- ✅ Multiple projection methods
- ✅ Type-safe with TypeScript
- ✅ Reusable across the application
- ✅ Well-documented and maintainable

