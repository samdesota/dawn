import { Component, For, createSignal } from "solid-js";
import { chordProgressionState } from "../state/ChordProgressionState";
import { keyboardState } from "../state/KeyboardState";
import { Key } from "@solid-primitives/keyed";
import { useIsMobile } from "../../utils/deviceUtils";

export const SongSelector: Component = () => {
  const isMobile = useIsMobile();
  const [hoveredSong, setHoveredSong] = createSignal<string | null>(null);
  const [touchStart, setTouchStart] = createSignal<number | null>(null);
  const [touchOffset, setTouchOffset] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);

  const handleSongSelect = (songName: string) => {
    chordProgressionState.selectSong(songName);
    keyboardState.updateHighlighting();
  };

  const navigateToNextSong = () => {
    const songs = getAvailableSongs();
    const currentIndex = getCurrentSongIndex();
    if (currentIndex < songs.length - 1) {
      handleSongSelect(songs[currentIndex + 1]);
    }
  };

  const navigateToPrevSong = () => {
    const songs = getAvailableSongs();
    const currentIndex = getCurrentSongIndex();
    if (currentIndex > 0) {
      handleSongSelect(songs[currentIndex - 1]);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchOffset(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStart() === null) return;

    const currentTouch = e.touches[0].clientX;
    const diff = currentTouch - touchStart()!;
    setTouchOffset(diff);
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50; // minimum distance for a swipe
    const offset = touchOffset();

    if (Math.abs(offset) > swipeThreshold) {
      if (offset > 0) {
        // Swiped right - go to previous song
        navigateToPrevSong();
      } else {
        // Swiped left - go to next song
        navigateToNextSong();
      }
    }

    setTouchStart(null);
    setTouchOffset(0);
    setIsDragging(false);
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
    const baseWidth = isMobile() ? window.innerWidth * 0.7 : 256; // w-64 = 256px
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
          xOffset +=
            direction *
            ((baseWidth * prevScale) / 2 +
              spacing +
              (baseWidth * nextScale) / 2);
        }
      }

      return {
        name: songName,
        info: chordProgressionState.getSongInfo(songName),
        index,
        isCurrent,
        isAdjacent,
        isVisible,
        distance,
        position: index - currentIndex,
        xOffset,
        scale,
      };
    });
  };

  return (
    <div class="vflex flex-1">
      <h2 class="text-xl font-semibold text-center m-4 text-white min-h-0 flex-shrink-0">
        Pick a jam
      </h2>

      {/* Cover Flow Container */}
      <div
        class="vflex relative overflow-hidden flex-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div class="flex flex-1 items-stretch justify-center h-full relative">
          <Key each={getSongDisplayData()} by={(song) => song.name}>
            {(song) => (
              <div
                class={`vflex flex-1 h-full absolute cursor-pointer ${
                  isMobile() ? "w-70vw" : "w-64"
                }`}
                classList={{
                  "transition-all duration-300": !isDragging(),
                }}
                style={{
                  transform: `translateX(${
                    song().xOffset + touchOffset()
                  }px) scale(${song().scale}) rotateY(${
                    song().position * 15
                  }deg)`,
                  "z-index": song().isCurrent ? 10 : song().isAdjacent ? 5 : 1,
                  opacity: song().isVisible
                    ? song().isCurrent
                      ? 1
                      : song().isAdjacent
                      ? 0.5
                      : 0.3
                    : 0,
                  "pointer-events": song().isVisible ? "auto" : "none",
                }}
                onClick={() => !isDragging() && handleSongSelect(song().name)}
                onMouseEnter={() => setHoveredSong(song.name)}
                onMouseLeave={() => setHoveredSong(null)}
              >
                <div
                  class="vflex flex-1 rounded-lg p-4 shadow-lg transition-all duration-300 my-12 border border-gray-700"
                  style="background-color: #1c1c1c;"
                  classList={{
                    "ring-2 ring-yellow-500": song().isCurrent,
                  }}
                >
                  {/* Song Title */}
                  <div class="text-center mb-3">
                    <h3
                      class="font-bold text-lg truncate"
                      classList={{
                        "text-yellow-400": song().isCurrent,
                        "text-white": !song().isCurrent,
                      }}
                    >
                      {song().name}
                    </h3>
                  </div>

                  {/* Song Info */}
                  <div
                    class={`grid grid-cols-3 gap-2 ${
                      isMobile() ? "py-4" : "my-auto"
                    }`}
                  >
                    <div class="text-center">
                      <div class="text-gray-400 text-xs">Key</div>
                      <div class="text-white font-medium">
                        {song().info?.key}
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-gray-400 text-xs">Tempo</div>
                      <div class="text-white font-medium">
                        {song().info?.defaultTempo}
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-gray-400 text-xs">Chords</div>
                      <div class="text-white font-medium">
                        {song().info?.chords?.length}
                      </div>
                    </div>
                  </div>

                  {/* Chord Progression - Mobile Only */}
                  {isMobile() && (
                    <div class="mt-6 pt-6 border-t border-gray-700">
                      <div class="text-gray-400 text-sm text-center mb-4 font-medium">
                        Chord Progression
                      </div>
                      <div class="grid grid-cols-4 gap-2 px-2">
                        <For each={song().info?.chords || []}>
                          {(chord) => (
                            <div class="bg-gray-800 rounded-lg py-3 shadow-md">
                              <div class="text-center">
                                <div class="text-white font-bold text-base mb-1">
                                  {chord.symbol}
                                </div>
                                <div class="text-gray-400 text-xs">
                                  {chord.romanNumeral}
                                </div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Key>
        </div>
      </div>
    </div>
  );
};
