// Musical data for the Hex Improv component

// Define musical scales
export const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9]
};

// Define chord progressions
export const progressions = {
  'I-V-vi-IV': [0, 4, 5, 3],
  'vi-IV-I-V': [5, 3, 0, 4],
  'I-vi-ii-V': [0, 5, 1, 4],
  'I-bVII-IV-I': [0, 6, 3, 0],
  'i-bVI-bVII-i': [0, 5, 6, 0]
};

// Define chord names based on scale type
export const chordNames = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  minor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']
};

// Get chord colors based on diatonic function
export function getChordColors(chordIndex: number, scaleType: 'major' | 'minor') {
  const colorPalettes = {
    major: [
      // I - Tonic (warm gold/yellow)
      { root: 'rgba(255, 215, 0, 0.9)', third: 'rgba(255, 235, 120, 0.8)', fifth: 'rgba(255, 245, 180, 0.7)' },
      // ii - Subdominant (cool blue)
      { root: 'rgba(70, 130, 255, 0.9)', third: 'rgba(120, 160, 255, 0.8)', fifth: 'rgba(170, 200, 255, 0.7)' },
      // iii - Mediant (purple)
      { root: 'rgba(138, 43, 226, 0.9)', third: 'rgba(168, 103, 236, 0.8)', fifth: 'rgba(198, 163, 246, 0.7)' },
      // IV - Subdominant (green)
      { root: 'rgba(34, 139, 34, 0.9)', third: 'rgba(84, 169, 84, 0.8)', fifth: 'rgba(134, 199, 134, 0.7)' },
      // V - Dominant (red/orange)
      { root: 'rgba(255, 69, 0, 0.9)', third: 'rgba(255, 119, 70, 0.8)', fifth: 'rgba(255, 169, 140, 0.7)' },
      // vi - Relative minor (soft pink)
      { root: 'rgba(219, 112, 147, 0.9)', third: 'rgba(229, 152, 177, 0.8)', fifth: 'rgba(239, 192, 207, 0.7)' },
      // vii° - Leading tone (dark purple)
      { root: 'rgba(75, 0, 130, 0.9)', third: 'rgba(125, 70, 160, 0.8)', fifth: 'rgba(175, 140, 190, 0.7)' }
    ],
    minor: [
      // i - Tonic (deep blue)
      { root: 'rgba(25, 25, 112, 0.9)', third: 'rgba(75, 75, 142, 0.8)', fifth: 'rgba(125, 125, 172, 0.7)' },
      // ii° - Diminished (dark gray)
      { root: 'rgba(105, 105, 105, 0.9)', third: 'rgba(135, 135, 135, 0.8)', fifth: 'rgba(165, 165, 165, 0.7)' },
      // III - Relative major (bright gold)
      { root: 'rgba(255, 215, 0, 0.9)', third: 'rgba(255, 235, 120, 0.8)', fifth: 'rgba(255, 245, 180, 0.7)' },
      // iv - Subdominant (forest green)
      { root: 'rgba(34, 139, 34, 0.9)', third: 'rgba(84, 169, 84, 0.8)', fifth: 'rgba(134, 199, 134, 0.7)' },
      // v - Minor dominant (brick red)
      { root: 'rgba(178, 34, 34, 0.9)', third: 'rgba(198, 84, 84, 0.8)', fifth: 'rgba(218, 134, 134, 0.7)' },
      // VI - Major sixth (cyan)
      { root: 'rgba(0, 206, 209, 0.9)', third: 'rgba(70, 226, 229, 0.8)', fifth: 'rgba(140, 246, 249, 0.7)' },
      // VII - Major seventh (orange)
      { root: 'rgba(255, 140, 0, 0.9)', third: 'rgba(255, 170, 70, 0.8)', fifth: 'rgba(255, 200, 140, 0.7)' }
    ]
  };
  
  return colorPalettes[scaleType][chordIndex] || colorPalettes.major[0];
}

// Helper function to interpolate between two colors
export function interpolateColor(color1: string, color2: string, amount: number) {
  // Handle null/undefined colors
  if (!color1 || !color2) {
    return color1 || color2 || 'rgba(100, 150, 255, 0.6)';
  }
  
  // Extract RGBA values from rgba strings
  const match1 = color1.match(/rgba?\(([^)]+)\)/);
  const match2 = color2.match(/rgba?\(([^)]+)\)/);
  
  if (!match1 || !match2) {
    return color1; // Fallback to first color if parsing fails
  }
  
  const rgba1 = match1[1].split(',').map(x => parseFloat(x.trim()));
  const rgba2 = match2[1].split(',').map(x => parseFloat(x.trim()));
  
  const r = Math.round(rgba1[0] + (rgba2[0] - rgba1[0]) * amount);
  const g = Math.round(rgba1[1] + (rgba2[1] - rgba1[1]) * amount);
  const b = Math.round(rgba1[2] + (rgba2[2] - rgba1[2]) * amount);
  const a = rgba1[3] + (rgba2[3] - rgba1[3]) * amount;
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}