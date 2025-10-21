import { Component, For, createSignal } from 'solid-js';
import { chordProgressionState } from '../state/ChordProgressionState';
import { keyboardState } from '../state/KeyboardState';
import { Key } from '@solid-primitives/keyed';

export const SongSelector: Component = () => {
  const [hoveredSong, setHoveredSong] = createSignal<string | null>(null);

  const handleSongSelect = (songName: string) => {
    chordProgressionState.selectSong(songName);
    keyboardState.updateHighlighting();
  };

  const getAvailableSongs = () => {
    return chordProgressionState.getAvailableSongs();
  };

  const getCurrentSongIndex = () => {
    const currentSong = chordProgressionState.currentSongValue?.name;
    const songs = getAvailableSongs();
    return currentSong ? songs.indexOf(currentSong) : 0;
  };

  const getScaleForDistance = (distance: number) => {
    if (distance === 0) return 1;
    if (distance === 1) return 0.8;
    return 0.6;
  };

  const getSongDisplayData = () => {
    const songs = getAvailableSongs();
    const currentIndex = getCurrentSongIndex();
    const baseWidth = 256; // w-64 = 256px
    const spacing = 32; // spacing between cards

    return songs.map((songName, index) => {
      const distance = Math.abs(index - currentIndex);
      const relativePosition = index - currentIndex;
      const isCurrent = index === currentIndex;
      const isAdjacent = distance === 1;
      const isVisible = distance <= 2;
      const scale = getScaleForDistance(distance);

      // Calculate dynamic position based on accumulated scaled widths
      let xOffset = 0;
      if (relativePosition !== 0) {
        const direction = relativePosition > 0 ? 1 : -1;
        for (let i = 0; i < Math.abs(relativePosition); i++) {
          const dist = i === 0 ? 0 : i;
          const prevScale = getScaleForDistance(dist);
          const nextScale = getScaleForDistance(dist + 1);
          // Add half of previous card width + spacing + half of next card width
          xOffset += direction * ((baseWidth * prevScale / 2) + spacing + (baseWidth * nextScale / 2));
        }
      }

      return {
        name: songName,
        index,
        isCurrent,
        isAdjacent,
        isVisible,
        distance,
        position: index - currentIndex,
        xOffset,
        scale
      };
    });
  };

  const getSongInfo = (songName: string) => {
    // Get song info by temporarily selecting it (without triggering state change)
    const songs = chordProgressionState.getAvailableSongs();
    const songIndex = songs.indexOf(songName);
    if (songIndex === -1) return null;

    // This is a simplified version - you might need to access song data differently
    const currentSong = chordProgressionState.currentSongValue;
    if (currentSong?.name === songName) {
      return {
        key: currentSong.key,
        tempo: currentSong.defaultTempo,
        chordCount: currentSong.chords.length
      };
    }

    return { key: 'C', tempo: 120, chordCount: 4 }; // Default fallback
  };

  return (
    <div class="cover-flow-selector">
      <h2 class="text-xl font-semibold text-center mb-6 text-white">Pick a song</h2>

      {/* Cover Flow Container */}
      <div class="cover-flow-container relative h-48 overflow-hidden">
        <div class="flex items-center justify-center h-full relative">
          <Key each={getSongDisplayData()} by={(song) => song.name}>
            {(song) => (
              <div
                class="song-card absolute cursor-pointer transition-all duration-300"
                style={{
                  transform: `translateX(${song().xOffset}px) scale(${song().scale}) rotateY(${song().position * 15}deg)`,
                  'z-index': song().isCurrent ? 10 : song().isAdjacent ? 5 : 1,
                  opacity: song().isVisible ? (song().isCurrent ? 1 : song().isAdjacent ? 0.8 : 0.4) : 0,
                  'pointer-events': song().isVisible ? 'auto' : 'none',
                }}
                onClick={() => handleSongSelect(song().name)}
                onMouseEnter={() => setHoveredSong(song.name)}
                onMouseLeave={() => setHoveredSong(null)}
              >
                <div
                  class="song-card-inner w-64 h-40 rounded-lg p-4 shadow-lg transition-all duration-300"
                  style="background-color: #1c1c1c;"
                  classList={{
                    'ring-2 ring-yellow-500': song().isCurrent,
                    'ring-1 ring-gray-500': song().isAdjacent && !song().isCurrent,
                    'hover:ring-2 hover:ring-blue-400': hoveredSong() === song().name && !song().isCurrent
                  }}
                >
                  {/* Song Title */}
                  <div class="text-center mb-3">
                    <h3
                      class="font-bold text-lg truncate"
                      classList={{
                          'text-yellow-400': song().isCurrent,
                          'text-white': !song().isCurrent
                      }}
                    >
                      {song().name}
                    </h3>
                  </div>

                  {/* Song Info */}
                  <div class="grid grid-cols-3 gap-2 text-sm">
                    <div class="text-center">
                      <div class="text-gray-400 text-xs">Key</div>
                      <div class="text-white font-medium">{getSongInfo(song().name)?.key}</div>
                    </div>
                    <div class="text-center">
                      <div class="text-gray-400 text-xs">Tempo</div>
                      <div class="text-white font-medium">{getSongInfo(song().name)?.tempo}</div>
                    </div>
                    <div class="text-center">
                      <div class="text-gray-400 text-xs">Chords</div>
                      <div class="text-white font-medium">{getSongInfo(song().name)?.chordCount}</div>
                    </div>
                  </div>

                  {/* Current Song Indicator */}
                  {song().isCurrent && (
                    <div class="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div class="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        CURRENT
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Key>
        </div>
      </div>

      {/* Navigation Dots */}
      <div class="flex justify-center mt-4 space-x-2">
        <For each={getAvailableSongs()}>
          {(songName, index) => (
            <button
              onClick={() => handleSongSelect(songName)}
              class="w-2 h-2 rounded-full transition-colors duration-200"
              classList={{
                'bg-yellow-500': index() === getCurrentSongIndex(),
                'bg-gray-600 hover:bg-gray-400': index() !== getCurrentSongIndex()
              }}
              aria-label={`Select ${songName}`}
            />
          )}
        </For>
      </div>
    </div>
  );
};
