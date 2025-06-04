import { createSignal, For, Show, createMemo } from "solid-js";
import { formatFileSize } from "../utils/audioUtils/formatFileSize";
import { createAudioPlayer } from "../utils/audioUtils/createAudioPlayer";
import { FolderIcon, ChevronRightIcon } from "../components/Icons";
import {
  Sample,
  isFileSystemAccessSupported,
  selectDirectory,
  listAudioSamplesRecursively,
  groupSamplesByFolder,
} from "../utils/fileSystemUtils";

const ListSamples = () => {
  const [directoryHandle, setDirectoryHandle] =
    createSignal<FileSystemDirectoryHandle | null>(null);
  const [samples, setSamples] = createSignal<Sample[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  // Track which folders are expanded (all collapsed by default)
  const [expandedFolders, setExpandedFolders] = createSignal<
    Record<string, boolean>
  >({});

  // Use our audio player hook
  const { currentlyPlaying, playSample, isPlaying } = createAudioPlayer();

  // Group samples by folder
  const groupedSamples = createMemo(() => groupSamplesByFolder(samples()));

  // Select folder and list samples
  const handleSelectFolder = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Show directory picker
      const handle = await selectDirectory();
      setDirectoryHandle(handle);

      // List folder contents recursively
      const audioSamples = await listAudioSamplesRecursively(handle);
      setSamples(audioSamples);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle playing a sample with error handling
  const handlePlaySample = async (sample: Sample) => {
    try {
      await playSample(sample);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to play sample");
      }
    }
  };

  // Toggle folder expansion
  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => {
      const newState = { ...prev };
      newState[folder] = !prev[folder];
      return newState;
    });
  };

  // Check if a folder is expanded
  const isFolderExpanded = (folder: string) => {
    return expandedFolders()[folder] === true;
  };

  return (
    <div>
      <h2 class="text-2xl font-bold mb-4">Audio Sample Browser</h2>

      <div class="mb-6">
        <button
          onClick={handleSelectFolder}
          disabled={isLoading()}
          class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading()
            ? "Loading..."
            : directoryHandle()
              ? "Change Folder"
              : "Select Samples Folder"}
        </button>
      </div>

      <Show when={error()}>
        <div
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span class="block sm:inline">{error()}</span>
        </div>
      </Show>

      <Show when={directoryHandle() && !isLoading()}>
        <div class="mb-2 text-sm text-gray-600">
          Folder: {directoryHandle()?.name}
        </div>
      </Show>

      <Show when={samples().length > 0}>
        <div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div class="divide-y divide-gray-200">
            {/* Group samples by folder */}
            <For each={Object.entries(groupedSamples())}>
              {([folder, folderSamples]) => (
                <div>
                  {/* Folder header - clickable to expand/collapse */}
                  <div
                    class="bg-gray-100 p-2 px-4 font-medium flex items-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => toggleFolder(folder)}
                  >
                    {/* Expand/collapse arrow icon */}
                    <ChevronRightIcon class={isFolderExpanded(folder) ? "rotate-90" : ""} />
                    
                    {/* Folder icon */}
                    <FolderIcon />

                    {/* Folder name and file count */}
                    <span>{folder === "Root" ? "Root Directory" : folder}</span>
                    <span class="ml-2 text-xs text-gray-500">
                      ({folderSamples.length} files)
                    </span>
                  </div>

                  {/* Folder contents - show only when expanded */}
                  <Show when={isFolderExpanded(folder)}>
                    <div class="folder-contents">
                      <For each={folderSamples}>
                        {(sample) => (
                          <div class="flex items-center justify-between p-4 hover:bg-gray-50 border-t border-gray-100">
                            <div class="flex-1 mr-4">
                              <div class="font-medium">{sample.fileName}</div>
                              <div class="text-sm text-gray-500">
                                {formatFileSize(sample.size)} •{" "}
                                {new Date(
                                  sample.lastModified,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => handlePlaySample(sample)}
                              class={`${
                                isPlaying(sample.name)
                                  ? "bg-purple-500 hover:bg-purple-600"
                                  : "bg-green-500 hover:bg-green-600"
                              } text-white px-3 py-1 rounded text-sm`}
                            >
                              {isPlaying(sample.name) ? "Playing..." : "Play"}
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={directoryHandle() && samples().length === 0 && !isLoading()}>
        <div class="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-gray-600">No audio samples found in this folder.</p>
        </div>
      </Show>
    </div>
  );
};

export default ListSamples;
