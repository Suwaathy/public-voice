import axios from 'axios';

export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();

  // Convert blob to a file
  const audioFile = new File([audioBlob], 'complaint.webm', { type: 'audio/webm' });
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  formData.append('language', 'ta'); // change to 'si' for Sinhala, 'en' for English

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer YOUR_OPENAI_API_KEY`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.text;
  } catch (error) {
    console.error('Whisper error:', error);
    return 'Transcription failed. Please type your complaint instead.';
  }
};