import * as FileSystem from 'expo-file-system/legacy';

/**
 * Delete an image file from the device
 * @param uri - The file URI to delete
 * @returns true if deleted successfully, false otherwise
 */
export async function deleteImage(uri: string | undefined | null): Promise<boolean> {
  if (!uri) return false;

  try {
    // Only delete files in our app's directory (don't delete photos from camera roll)
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to delete image:', error);
    return false;
  }
}

/**
 * Copy an image to app's document directory for persistence
 * Images from camera/picker are in cache and may be deleted by OS
 * @param sourceUri - The source image URI
 * @returns The new persistent URI, or the original if copy fails
 */
export async function persistImage(sourceUri: string): Promise<string> {
  try {
    const fileName = `expense_${Date.now()}.jpg`;
    const destUri = `${FileSystem.documentDirectory}images/${fileName}`;

    // Ensure images directory exists
    const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}images`);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images`, {
        intermediates: true,
      });
    }

    // Copy the image
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });

    return destUri;
  } catch (error) {
    console.warn('Failed to persist image:', error);
    return sourceUri; // Return original URI as fallback
  }
}
