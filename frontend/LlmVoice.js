import React, { useState } from 'react';

export default function LlmVoice({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  function startRecording() {
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      if (onTranscript) onTranscript(text);
    };

    recognition.start();
  }

  function speak(text) {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    synth.speak(utterance);
  }

  return (
    <div className="voice-container" aria-live="polite">
      <button
        onClick={startRecording}
        aria-label="Activate voice input"
        className={`mic-button ${isRecording ? 'recording' : ''}`}
      >
        🎤
      </button>
      {transcript && <p className="transcript">You said: {transcript}</p>}
    </div>
  );
}
