/**
 * Share utility functions
 */

export interface ShareData {
  title: string;
  text?: string;
  url: string;
}

/**
 * Share content using Web Share API with fallback
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  const shareData: ShareData = {
    title: data.title,
    text: data.text || `Check out ${data.title}`,
    url: data.url,
  };

  // Check if Web Share API is available
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareData.url);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Share event with formatted message
 */
export async function shareEvent(eventTitle: string, eventId: string): Promise<boolean> {
  const url = `${window.location.origin}/event/${eventId}`;
  return shareContent({
    title: eventTitle,
    text: `Check out this event: ${eventTitle}`,
    url,
  });
}


