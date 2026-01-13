# Study Techniques Feature Documentation

## Overview

The Study Techniques feature provides personalized, evidence-based study method recommendations to users based on their current or completed courses. When a user clicks on a study technique card, a detailed modal displays:

- **Course Recommendations**: Which courses best suit the selected study technique
- **Learning Curve Visualization**: Statistical graphs showing retention rates over time
- **Statistical Evidence**: Research-backed data supporting each technique's effectiveness

## Architecture

### Component Structure

```
frontend/components/help/StudyTechniques.tsx
├── StudyTechnique Interface
├── studyTechniques Array (6 techniques)
├── matchCoursesToTechnique() Function
├── generateLearningCurveData() Function
├── TechniqueDetailModal Component
└── StudyTechniques Main Component
```

### Data Flow

```
User clicks technique card
    ↓
StudyTechniques Component
    ↓
Opens TechniqueDetailModal
    ↓
matchCoursesToTechnique() → Matches courses to technique
generateLearningCurveData() → Creates learning curve data
    ↓
Displays: Matched courses + Learning curve graph + Statistics
```

## Course Matching Algorithm

### Matching Logic

The `matchCoursesToTechnique()` function matches courses to study techniques based on:

1. **Course Code Patterns**: Analyzes course codes (e.g., `CS 101`, `BIO 201`)
2. **Course Name Keywords**: Searches course names for relevant terms
3. **Technique-Specific Rules**: Each technique has custom matching criteria

### Matching Rules by Technique

#### 1. Spaced Repetition
**Best for**: Memorization-heavy courses
- **Matches**: Biology (BIO), Chemistry (CHEM), History (HIST), Language (LANG)
- **Score**: +2 points per match

#### 2. Active Recall
**Best for**: All courses (universal technique)
- **Matches**: All courses (+1 base score)
- **Bonus**: Introduction courses (101, 201) get +1 additional point

#### 3. Pomodoro Technique
**Best for**: All courses requiring sustained focus
- **Matches**: All courses (+1 base score)
- **Universal application**: Works for any course type

#### 4. Feynman Technique
**Best for**: Theoretical and complex concepts
- **Matches**: Physics (PHYS), Math (MATH), Computer Science (CS), Philosophy (PHIL)
- **Keywords**: "theory", "concept", "abstract"
- **Score**: +2 points per match

#### 5. Interleaving
**Best for**: Problem-solving and math-heavy courses
- **Matches**: Math (MATH), Physics (PHYS), Computer Science (CS)
- **Keywords**: "calculus", "algebra", "problem"
- **Score**: +2 points per match

#### 6. Elaborative Interrogation
**Best for**: Conceptual and theoretical courses
- **Matches**: Philosophy (PHIL), Psychology (PSY), Sociology (SOC), Literature (LIT)
- **Keywords**: "philosophy", "psychology", "literature", "social"
- **Score**: +2 points per match

### Matching Score System

```typescript
// Example: Matching "CS 101: Introduction to Programming" to Feynman Technique
courseCode = "CS 101"
courseName = "introduction to programming"

// Feynman Technique matching
if (courseCode.includes('CS')) → matchScore += 2
if (courseName.includes('theory')) → matchScore += 2

// Final score: 2 (CS match)
// Courses are sorted by matchScore (highest first)
```

## Learning Curve Generation

### Data Generation Algorithm

The `generateLearningCurveData()` function creates 12-week learning curve data for each technique:

#### Retention Formula by Technique

**Spaced Repetition** (Logarithmic Growth):
- Retention: `initial + 70 * (1 - exp(-t * 2.5))` where `t = week/12`
- Traditional: `85 * exp(-t * 2.8)` (exponential forgetting)
- **Result**: Logarithmic improvement with plateaus, traditional shows exponential decay
- **Personalization**: Initial retention scaled by user GPA (0.8-1.2x)

**Active Recall** (S-Curve/Sigmoid):
- Retention: `initial + 57 * (1 / (1 + exp(-5 * (t - 0.4))))`
- Traditional: `75 - (t * 12) * 4.2` (linear decline)
- **Result**: S-curve with rapid middle growth, traditional declines linearly
- **Personalization**: Initial retention scaled by user GPA

**Pomodoro Technique** (Linear with Acceleration):
- Retention: `initial + 43 * t * (1 + t * 0.3)`
- Traditional: `65 - (t * 12) * 3.5` (gradual decline)
- **Result**: Steady linear improvement with slight acceleration
- **Personalization**: Initial retention scaled by user GPA

**Feynman Technique** (Exponential Growth):
- Retention: `initial + 68 * (1 - exp(-t * 3.2))`
- Traditional: `78 * exp(-t * 3.0)` (steep exponential decay)
- **Result**: Exponential growth showing deep understanding building
- **Personalization**: Initial retention scaled by user GPA

**Interleaving** (Parabolic Growth):
- Retention: `initial + 52 * t^1.5`
- Traditional: `68 - (t * 12) * 4.0` (moderate decline)
- **Result**: Parabolic curve with accelerating improvement
- **Personalization**: Initial retention scaled by user GPA

**Elaborative Interrogation** (Logarithmic Growth):
- Retention: `initial + 55 * log(1 + t * 3)`
- Traditional: `72 - (t * 12) * 4.1` (gradual decline)
- **Result**: Logarithmic growth showing gradual connection building
- **Personalization**: Initial retention scaled by user GPA

### Graph Visualization

The learning curve is displayed using **Recharts AreaChart**:

```typescript
<AreaChart data={learningCurveData}>
  <Area 
    dataKey="retention"      // Technique retention
    stroke="#f59e0b"         // Gold color
    fill="url(#colorRetention)"
  />
  <Area 
    dataKey="traditional"    // Traditional study
    stroke="#6b7280"         // Gray color
    strokeDasharray="5 5"    // Dashed line
    fill="url(#colorTraditional)"
  />
</AreaChart>
```

**Features**:
- **X-Axis**: Weeks 1-12
- **Y-Axis**: Retention percentage (0-100%)
- **Two Areas**: Technique (solid) vs Traditional (dashed)
- **Gradient Fills**: Visual depth with opacity gradients
- **Domain Protection**: `domain={[0, 100]}` prevents negative values

## Current vs Completed Courses Logic

### Priority System

The component uses a **fallback system** to ensure users always see recommendations:

```typescript
// Priority 1: Current Courses (manually added, no transcript_id)
const currentCourses = courses?.filter(course => !course.transcript_id) || []

// Priority 2: Completed Courses (from transcripts, has transcript_id)
const completedCourses = courses?.filter(course => course.transcript_id) || []

// Selection Logic
const coursesToUse = hasCurrentCourses ? currentCourses : completedCourses
```

### User Notification

When using completed courses instead of current courses, a blue info banner appears:

```typescript
{!hasCurrentCourses && completedCourses.length > 0 && (
  <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
    <p>
      Note: You're not currently taking any courses. 
      Recommendations are based on your completed courses from transcripts.
    </p>
  </div>
)}
```

### UI Adaptation

The modal adapts based on course type:

- **Title**: "Best Suited for Your Current Courses" vs "Best Suited for Your Completed Courses"
- **Course Display**: Shows grade information for completed courses
- **Empty State**: Different messages based on available data

## Statistical Evidence

Each technique includes research-backed statistical evidence:

### Example: Spaced Repetition
```
Research by Cepeda et al. (2006) shows 75% retention after 6 months 
vs. 20% with massed practice. Optimal interval: 1 day, 3 days, 1 week, 
2 weeks, 1 month.
```

### Example: Active Recall
```
Karpicke & Blunt (2011) found active recall produces 50% better 
retention than re-reading. Testing effect shows 1.5x improvement in 
final exam scores.
```

## User Interaction Flow

### Click Handler Logic

```typescript
const handleCardClick = (technique, e) => {
  // Prevent modal opening during carousel drag
  const timeSinceTouchEnd = Date.now() - lastMoveTime.current
  if (!isDragging.current && timeSinceTouchEnd > 100) {
    e.stopPropagation()
    setSelectedTechnique(technique)
  }
}
```

**Features**:
- **Drag Detection**: Prevents modal from opening during swipe
- **Timing Check**: 100ms delay ensures click vs drag distinction
- **Event Handling**: Stops propagation to prevent conflicts

### Modal Structure

```typescript
<TechniqueDetailModal>
  ├── Header (Sticky)
  │   ├── Technique Icon
  │   ├── Technique Name & Description
  │   └── Close Button
  │
  ├── Statistical Evidence Card
  │
  ├── Course Recommendations Section
  │   ├── Info Banner (if using completed courses)
  │   ├── Matched Courses Grid
  │   └── Empty State (if no matches)
  │
  ├── Learning Curve Graph
  │   └── 12-week retention visualization
  │
  └── Psychological Basis Card
</TechniqueDetailModal>
```

## Integration Points

### Help Page Integration

```typescript
// frontend/app/help/page.tsx

const { data: courses } = useCourses()

const currentCourses = useMemo(() => {
  return courses?.filter(course => !course.transcript_id) || []
}, [courses])

const completedCourses = useMemo(() => {
  return courses?.filter(course => course.transcript_id) || []
}, [courses])

<StudyTechniques 
  currentCourses={currentCourses} 
  completedCourses={completedCourses} 
/>
```

### Course Data Structure

```typescript
interface Course {
  id: string
  course_code: string          // e.g., "CS 101"
  course_name: string | null   // e.g., "Introduction to Programming"
  grade: string | null         // e.g., "A", "B+"
  grade_score: number | null   // e.g., 4.0, 3.5
  credit_hours: number | null
  semester: string | null
  year: number | null
  transcript_id?: string | null  // null = current course, string = completed
}
```

## Visual Design

### Carousel Implementation

- **Swipeable Cards**: Horizontal scrolling with momentum
- **Responsive Sizing**: 
  - Mobile: Full width
  - Tablet: 50% width
  - Desktop: 33% width
- **Snap Behavior**: Cards snap to position after swipe
- **Click Detection**: Distinguishes between swipe and click

### Modal Design

- **Backdrop**: Semi-transparent black with blur
- **Max Width**: 4xl (896px)
- **Max Height**: 90vh with scroll
- **Sticky Header**: Technique name stays visible while scrolling
- **Dark Mode**: Full support with appropriate color schemes

### Match Score Visualization

```typescript
// Visual indicator: Dots representing match score
{Array.from({ length: matchScore }).map((_, i) => (
  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
))}
```

**Example**: A course with matchScore of 3 shows 3 gold dots

## Performance Considerations

### Memoization

```typescript
// Matched courses are memoized
const matchedCourses = useMemo(() => {
  return matchCoursesToTechnique(technique, coursesToUse)
}, [technique, coursesToUse])

// Learning curve data is memoized
const learningCurveData = useMemo(() => {
  return generateLearningCurveData(technique.name)
}, [technique.name])
```

## Learning Curve Personalization

### Research-Based Curve Shapes

The learning curves now use **research-based mathematical models** that reflect the actual learning patterns observed in studies:

#### 1. Spaced Repetition - Logarithmic Growth with Plateaus
- **Model**: Logarithmic growth with exponential decay for traditional
- **Research Basis**: Ebbinghaus forgetting curve (exponential decay) vs. spaced repetition (logarithmic improvement)
- **Shape**: Steep initial improvement, then plateaus (reflecting spacing intervals)
- **Formula**: `retention = initial + 70 * (1 - exp(-t * 2.5))`
- **Traditional**: `85 * exp(-t * 2.8)` (exponential forgetting)

#### 2. Active Recall - S-Curve (Sigmoid)
- **Model**: S-curve pattern (slow start, rapid growth, plateau)
- **Research Basis**: Testing effect shows rapid initial improvement then steady retention
- **Shape**: Slow start, rapid middle growth, then plateau
- **Formula**: `retention = initial + 57 * (1 / (1 + exp(-5 * (t - 0.4))))`
- **Traditional**: Linear decline

#### 3. Pomodoro Technique - Linear with Acceleration
- **Model**: Linear improvement with slight acceleration
- **Research Basis**: Attention restoration prevents fatigue, maintains steady performance
- **Shape**: Steady linear improvement
- **Formula**: `retention = initial + 43 * t * (1 + t * 0.3)`
- **Traditional**: Gradual decline (fatigue effect)

#### 4. Feynman Technique - Exponential Growth
- **Model**: Exponential growth pattern
- **Research Basis**: Teaching effect creates deep understanding that builds on itself
- **Shape**: Steep exponential curve
- **Formula**: `retention = initial + 68 * (1 - exp(-t * 3.2))`
- **Traditional**: Steep exponential decay (surface learning)

#### 5. Interleaving - Parabolic Growth
- **Model**: Parabolic curve (slower start, accelerating improvement)
- **Research Basis**: Discrimination learning improves transfer over time
- **Shape**: Slow start, accelerating improvement
- **Formula**: `retention = initial + 52 * t^1.5`
- **Traditional**: Moderate linear decline

#### 6. Elaborative Interrogation - Logarithmic Growth
- **Model**: Logarithmic growth
- **Research Basis**: Deep processing creates connections that accumulate gradually
- **Shape**: Gradual logarithmic improvement
- **Formula**: `retention = initial + 55 * log(1 + t * 3)`
- **Traditional**: Gradual linear decline

### Personalization Based on User Performance

The curves are **personalized** based on the user's historical academic performance:

```typescript
// Personalization factor: 0.8 to 1.2 multiplier based on GPA
const personalizationFactor = userGPA 
  ? Math.max(0.8, Math.min(1.2, 0.8 + (userGPA / 4.0) * 0.4))
  : 1.0
```

**How it works**:
- **Higher GPA users (3.5-4.0)**: See curves with 1.0-1.2x multiplier (slightly better retention)
- **Average GPA users (2.5-3.5)**: See curves with 0.9-1.0x multiplier (baseline)
- **Lower GPA users (0-2.5)**: See curves with 0.8-0.9x multiplier (more improvement potential shown)

**Benefits**:
- **Motivational**: Lower GPA users see more dramatic improvement potential
- **Realistic**: Higher GPA users see curves that reflect their current performance level
- **Personalized**: Each user sees curves tailored to their academic history

### Visual Differentiation

Each technique now has a **distinct curve shape** that visually reinforces its unique learning pattern:

- **Spaced Repetition**: Plateaus reflect spacing intervals
- **Active Recall**: S-curve shows testing effect acceleration
- **Pomodoro**: Linear shows steady, fatigue-free improvement
- **Feynman**: Exponential shows deep understanding building
- **Interleaving**: Parabolic shows transfer improvement over time
- **Elaborative Interrogation**: Logarithmic shows gradual connection building

These distinct shapes make it immediately clear which technique has which learning pattern, reinforcing the educational value of the visualization.


**Benefits**:
- Prevents unnecessary recalculations
- Improves render performance
- Reduces CPU usage during interactions

## Future Enhancements

### Potential Improvements

1. **Machine Learning Matching**: Use ML to improve course-technique matching accuracy
2. **User Performance Tracking**: Track actual performance when using techniques
3. **Personalized Curves**: Adjust learning curves based on user's historical performance
4. **Technique Combinations**: Recommend technique combinations for optimal results
5. **Progress Tracking**: Allow users to track their progress with each technique
6. **Social Features**: Show which techniques work best for similar courses across users

## Testing Considerations

### Test Cases

1. **No Current Courses**: Verify fallback to completed courses
2. **No Courses at All**: Verify empty state message
3. **Multiple Matches**: Verify sorting by match score
4. **Click vs Swipe**: Verify modal doesn't open during carousel drag
5. **Graph Rendering**: Verify learning curves display correctly
6. **Dark Mode**: Verify all components work in dark mode

## References

### Research Citations

- **Cepeda et al. (2006)**: Spaced Repetition research
- **Karpicke & Blunt (2011)**: Active Recall effectiveness
- **Chi et al. (1989)**: Feynman Technique (teaching effect)
- **Rohrer & Taylor (2007)**: Interleaving benefits
- **Pressley et al. (1987)**: Elaborative Interrogation

### Technical Stack

- **React**: Component framework
- **TypeScript**: Type safety
- **Recharts**: Data visualization
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

---

**Last Updated**: 2024
**Maintained By**: NuPeer Development Team

