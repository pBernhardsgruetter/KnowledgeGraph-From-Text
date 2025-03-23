interface TextProcessingRequest {
  text: string;
  window_size?: number;
}

interface TextProcessingResponse {
  tokens: string[];
  cooccurrences: Record<string, number>;
}

export const processText = async (
  data: TextProcessingRequest
): Promise<TextProcessingResponse> => {
  try {
    const response = await fetch('http://localhost:8000/api/process-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to process text');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing text:', error);
    throw error;
  }
}; 