/**
 * File system utilities for the sample browser
 */

// Add type declarations for the File System Access API
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

// Define types for our sample objects
export interface Sample {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  handle: FileSystemFileHandle;
  url?: string; // Optional URL for playback
}

// Check if File System Access API is supported
export const isFileSystemAccessSupported = (): boolean => {
  return "showDirectoryPicker" in window;
};

// Select a directory using the file system access API
export const selectDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error("Your browser doesn't support the File System Access API");
  }
  
  try {
    return await window.showDirectoryPicker();
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to select directory: ${err.message}`);
    } else {
      throw new Error("Failed to select directory: Unknown error");
    }
  }
};

// List audio samples from a directory recursively
export const listAudioSamplesRecursively = async (
  directoryHandle: FileSystemDirectoryHandle,
  path: string = ''
): Promise<Sample[]> => {
  const sampleFiles: Sample[] = [];

  try {
    // Recursive function to process directories
    const processDirectory = async (dirHandle: FileSystemDirectoryHandle, currentPath: string) => {
      for await (const entry of dirHandle.values()) {
        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        
        if (entry.kind === "file") {
          // Cast to FileSystemFileHandle to access getFile method
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();

          // Check if it's an audio file
          const isAudio =
            file.type.startsWith("audio/") ||
            [".mp3", ".wav", ".ogg", ".flac", ".aac"].some((ext) =>
              file.name.toLowerCase().endsWith(ext),
            );

          if (isAudio) {
            sampleFiles.push({
              name: entryPath, // Use the full path for display
              type: file.type || "audio/unknown",
              size: file.size,
              lastModified: file.lastModified,
              handle: fileHandle,
            });
          }
        } else if (entry.kind === "directory") {
          // Recursively process subdirectories
          await processDirectory(entry as FileSystemDirectoryHandle, entryPath);
        }
      }
    };

    // Start processing from the root directory
    await processDirectory(directoryHandle, path);
    
    // Sort the samples by their folder path for better organization
    sampleFiles.sort((a, b) => {
      // First sort by folder path
      const pathA = a.name.split('/').slice(0, -1).join('/');
      const pathB = b.name.split('/').slice(0, -1).join('/');
      
      if (pathA !== pathB) {
        return pathA.localeCompare(pathB);
      }
      
      // Then by filename
      return a.name.split('/').pop()!.localeCompare(b.name.split('/').pop()!);
    });
    
    return sampleFiles;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Error listing samples: ${err.message}`);
    } else {
      throw new Error("Error listing samples: Unknown error");
    }
  }
};

// Group samples by folder
export const groupSamplesByFolder = (samples: Sample[]) => {
  return samples.reduce((acc, sample) => {
    const pathParts = sample.name.split('/');
    const fileName = pathParts.pop() || '';
    const folderPath = pathParts.length > 0 ? pathParts.join('/') : 'Root';
    
    if (!acc[folderPath]) {
      acc[folderPath] = [];
    }
    
    acc[folderPath].push({...sample, fileName});
    return acc;
  }, {} as Record<string, Array<Sample & {fileName: string}>>);
};