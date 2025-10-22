# Swing Feel Feature

## Overview

Added swing feel support to the chord comping system, allowing jazz and blues songs to have authentic swing timing.

## What is Swing?

Swing timing is a rhythmic feel where eighth notes are played unevenly, with the first eighth note of each pair held longer than the second. This creates the characteristic "swing" feel essential to jazz and blues music.

- **50% (Straight)**: Even eighth notes (no swing)
- **67% (Triplet Swing)**: Classic jazz swing feel (plays like triplets)
- **75% (Heavy Swing)**: Exaggerated swing for a more laid-back feel

## Features Added

### 1. Swing Control

- **Swing Amount Slider**: Adjustable from 50% (straight) to 75% (heavy swing)
- **Visual Feedback**: Shows current swing percentage
- **Real-time Adjustment**: Can be changed while comping is playing
- **Default Values**: Songs automatically set appropriate swing amounts

### 2. Song-Specific Defaults

Each song now has default comping settings:

| Song                  | Default Rhythm | Default Swing  | Why?                                 |
| --------------------- | -------------- | -------------- | ------------------------------------ |
| **Pachelbel's Canon** | Quarter Notes  | 50% (straight) | Classical piece with straight timing |
| **12-Bar Blues**      | Jazz Swing     | 67% (triplet)  | Blues shuffle feel                   |
| **ii-V-I Jazz**       | Jazz Swing     | 67% (triplet)  | Standard jazz swing                  |
| **Pop Progression**   | Quarter Notes  | 50% (straight) | Modern pop with straight timing      |

### 3. Automatic Configuration

When you select a song:

- The rhythm pattern automatically switches to match the genre
- The swing amount adjusts to the appropriate feel
- You can still manually override these settings if desired

## How It Works

### Swing Timing Algorithm

The swing is applied to off-beat eighth notes (the "and" of each beat):

```typescript
// For a 16th note grid:
// Step 0, 4, 8, 12 = On-beat (no adjustment)
// Step 2, 6, 10, 14 = Off-beat 8th notes (swing applied)

swingDelay = (swingAmount - 0.5) * 2 * sixteenthNoteDuration;
```

This delays the off-beat notes, creating the swing feel.

### Examples

At 120 BPM with 67% swing:

- 16th note = 125ms
- Swing delay = (0.67 - 0.5) _ 2 _ 125ms = ~42ms
- Off-beats play 42ms later than straight timing

## Usage

### UI Controls

1. **Enable Chord Comping**: Turn on chord accompaniment
2. **Select Rhythm Pattern**: Choose from 8 rhythm patterns
3. **Adjust Swing Feel**: Use the swing slider (50% - 75%)
4. **Set Volume & Voicing**: Control mix and chord voicing

### Quick Start

1. Select "12-Bar Blues" or "ii-V-I Jazz"
2. Enable comping - it automatically uses swing settings
3. Press Play
4. Adjust swing amount to taste using the slider

## Technical Implementation

### Files Modified

- **ChordCompingState.ts**: Added swing calculation and timing offset
- **ChordProgressionState.ts**: Added default swing and rhythm to Song interface
- **ChordCompingControls.tsx**: Added swing slider UI control

### Key Methods

- `calculateSwingOffset(stepIndex)`: Computes timing offset for swing
- `setSwingAmount(amount)`: Updates swing feel (0.5 - 0.75)
- `setCompingSettingsCallback()`: Notifies comping of song changes

### Integration

- Songs notify comping state when selected
- Comping automatically applies song defaults
- User adjustments override defaults until song changes

## Musical Context

### Swing in Different Genres

**Jazz Standards** (67%):

- Walking bass lines
- Ride cymbal patterns
- Comping behind solos

**Blues Shuffle** (67%):

- Driving eighth-note feel
- Piano/guitar comping
- Classic blues sound

**Straight Feel** (50%):

- Classical music
- Pop/Rock
- Latin grooves (which use different patterns)

## Future Enhancements

Potential improvements:

- Per-pattern swing settings (some patterns sound better with different swing)
- Swing on 16th notes (shuffle feel)
- Groove templates combining rhythm + swing + feel
- Humanization (slight random variations)
- Swing amount automation over time

## Tips for Best Results

1. **Start with Defaults**: Let the song choose the initial settings
2. **Listen to the Feel**: Adjust swing to match your internal pulse
3. **Combine with Rhythm**: Try different patterns with various swing amounts
4. **Use Voicings**: Rootless voicings often work best with swing
5. **Experiment**: Try swing on non-jazz songs for interesting effects
