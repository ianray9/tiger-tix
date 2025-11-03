import React, { useState } from 'react';

export default function LlmVoice({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  function playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; 
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  }

  function startRecording() {
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    playBeep();

    // Small delay to let beep play before starting recording
    setTimeout(() => {
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
        speak(text);
      };

      recognition.start();
    }, 150);
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
