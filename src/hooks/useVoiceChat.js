"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

export const useVoiceChat = () => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isRecording, setIsRecording] = useState(false);
  const [sttActive, setSttActive] = useState(false);
  const sttActiveRef = useRef(false);
  
  // Audio state
  const [vadActive, setVadActive] = useState(false);
  const [latency, setLatency] = useState(0);
  const [audioVisualizerData, setAudioVisualizerData] = useState(Array(32).fill(0));
  
  // WebSocket and audio references
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const currentAudioSourceRef = useRef(null);
  const lastSpeechTimeRef = useRef(0);
  const responseTimeoutRef = useRef(null);
  const sttActiveInAudioProcessRef = useRef(false);
  
  // Callbacks for integration with existing chat system
  const onTranscriptRef = useRef(null);
  const onResponseRef = useRef(null);
  const onAudioChunkRef = useRef(null);
  const onAudioVisualizerRef = useRef(null);

  // Set callbacks for integration
  const setCallbacks = useCallback((callbacks) => {
    onTranscriptRef.current = callbacks.onTranscript;
    onResponseRef.current = callbacks.onResponse;
    onAudioChunkRef.current = callbacks.onAudioChunk;
    onAudioVisualizerRef.current = callbacks.onAudioVisualizer;
  }, []);

  // Keep sttActiveRef in sync with state
  useEffect(() => {
    sttActiveRef.current = sttActive;
  }, [sttActive]);

  // Update connection status
  const updateStatus = useCallback((status) => {
    setConnectionStatus(status);
  }, []);

  // Connect to voice WebSocket using environment variable
  const connect = useCallback(async () => {
    try {
      updateStatus('connecting');
      
      // Get WebSocket URL from environment variable
      const baseUrl = process.env.NEXT_PUBLIC_NEXT_WEB_API ;
      // Convert HTTP(S) URL to WebSocket URL if needed
      const wsUrl = baseUrl.replace(/^https?:\/\//, 'ws://').replace(/^http:\/\//, 'ws://');
      
      console.log('🎙️ Connecting to voice WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        updateStatus('connected');
        console.log('🎙️ Voice WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        handleMessage(JSON.parse(event.data));
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        updateStatus('disconnected');
        stopVoiceChat();
        console.log('🎙️ Voice WebSocket disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('🎙️ Voice WebSocket error:', error);
        updateStatus('disconnected');
      };
      
    } catch (error) {
      console.error('🎙️ Failed to connect to voice WebSocket:', error);
      updateStatus('disconnected');
    }
  }, []);

  // Disconnect from voice WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopVoiceChat();
    setIsConnected(false);
    updateStatus('disconnected');
  }, []);

  // Handle WebSocket messages
  const handleMessage = useCallback((data) => {
    console.log('🎙️ Voice message received:', data);
    
    switch (data.type) {
      case 'connection_ready':
        console.log('🎙️ Voice connection ready');
        break;
        
      case 'stt_ready':
        setSttActive(true);
        sttActiveRef.current = true;
        console.log('🎙️ STT ready - now processing audio input');
        break;
        
      case 'stt_unavailable':
        alert('Speech-to-text service unavailable. Please check Deepgram API key.');
        sttActiveRef.current = false;
        stopVoiceChat();
        break;
        
      case 'speech_started':
        setVadActive(true);
        updateStatus('speaking');
        lastSpeechTimeRef.current = Date.now();
        stopCurrentAudio();
        break;
        
      case 'utterance_end':
        setVadActive(false);
        updateStatus('processing');
        break;
        
      case 'partial_transcript':
        if (onTranscriptRef.current) {
          onTranscriptRef.current(data.text, true); // partial = true
        }
        break;
        
      case 'final_transcript':
        console.log('🎙️ Final transcript received:', data.text);
        if (onTranscriptRef.current) {
          onTranscriptRef.current(data.text, false); // partial = false
        }
        setLatency(Date.now() - lastSpeechTimeRef.current);
        
        // The voice backend should automatically process this transcript
        // and send back an agent_response with audio. No additional message needed.
        console.log('🎙️ Transcript processed. Waiting for agent response from voice backend...');
        
        // Set a timeout to detect if backend doesn't respond
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
        }
        responseTimeoutRef.current = setTimeout(() => {
          console.warn('⚠️ No agent response received within 10 seconds. Check if your voice backend is configured to process transcripts and generate responses.');
        }, 10000);
        break;
        
      case 'agent_response':
        console.log('🎙️ Agent response received:', data.text);
        
        // Clear response timeout since we got a response
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
          responseTimeoutRef.current = null;
        }
        
        if (onResponseRef.current) {
          onResponseRef.current(data.text);
        }
        updateStatus('listening');
        break;
        
      case 'audio_chunk':
        // Start playback; start/end events are emitted inside playAudioChunk
        playAudioChunk(data.audio);
        break;
        
      case 'audio_end':
        console.log('🎙️ Audio playback complete');
        if (onAudioChunkRef.current) {
          try { onAudioChunkRef.current({ type: 'end' }); } catch {}
        }
        break;

      case 'audio':
        playAudioChunk(data.audio);
        break;
        
      case 'tts_interrupted':
        console.log('🎙️ TTS interrupted by user speech');
        break;
        
      case 'tts_cancelled':
        console.log('🎙️ TTS cancelled');
        break;
        
      case 'error':
        console.error('🎙️ Voice server error:', data.message);
        break;
        
      default:
        console.log('🎙️ Unknown voice message type:', data.type);
    }
  }, []);

  // Start voice chat
  const startVoiceChat = useCallback(async () => {
    console.log('🎙️ Starting voice chat...');
    console.log('🎙️ Connection status:', connectionStatus);
    console.log('🎙️ Is connected:', isConnected);
    console.log('🎙️ WebSocket state:', wsRef.current?.readyState);
    
    if (!isConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('🎙️ Cannot start voice chat - WebSocket not connected');
      alert('Please connect to the voice server first');
      return;
    }
    
    try {
      // Request microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      // Create processor for real-time audio processing
      processorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      
      processorRef.current.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Always update visualizer when recording
        updateAudioVisualizer(inputData);
        
        // Send audio chunks when STT is active (via ref to avoid stale closure)
        if (sttActiveRef.current) {
          sendAudioChunk(inputData);
        }
      };
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      // Start STT streaming
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('🎙️ Sending stt_stream_start message');
        wsRef.current.send(JSON.stringify({
          type: 'stt_stream_start',
          language: 'en-US'
        }));
      } else {
        console.error('🎙️ WebSocket not connected when trying to start STT');
      }
      
      setIsRecording(true);
      updateStatus('listening');
      console.log('🎙️ Voice chat started, waiting for STT ready...');
      
    } catch (error) {
      console.error('🎙️ Failed to start voice chat:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [sttActive, isConnected, connectionStatus]);

  // Stop voice chat
  const stopVoiceChat = useCallback(() => {
    stopCurrentAudio();
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (wsRef.current && sttActive) {
      wsRef.current.send(JSON.stringify({ type: 'stt_stream_end' }));
    }
    
    setIsRecording(false);
    setSttActive(false);
    sttActiveRef.current = false;
    setVadActive(false);
    setAudioVisualizerData(Array(32).fill(0)); // Reset visualizer
    
    if (isConnected) {
      updateStatus('connected');
    }
  }, [isConnected, sttActive]);

  // Send audio chunk to backend
  const sendAudioChunk = useCallback((audioData) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('🎙️ Cannot send audio chunk - WebSocket not connected');
      return;
    }
    
    // Convert Float32Array to PCM16
    const pcm16 = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
    }
    
    // Convert to base64
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
    
    wsRef.current.send(JSON.stringify({
      type: 'stt_audio_chunk',
      audio: audioBase64
    }));
    
    // Debug: Log audio level
    const audioLevel = audioData.reduce((sum, sample) => sum + Math.abs(sample), 0) / audioData.length;
    if (audioLevel > 0.01) {
      console.log('🎙️ Audio chunk sent, level:', audioLevel.toFixed(4));
    }
  }, []);

  // Update audio visualizer with real-time data (same as web.html)
  const updateAudioVisualizer = useCallback((audioData) => {
    const barCount = 32;
    const bufferLength = audioData.length;
    const samplesPerBar = Math.floor(bufferLength / barCount);
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        sum += Math.abs(audioData[i * samplesPerBar + j]);
      }
      const average = sum / samplesPerBar;
      const height = Math.min(1, average * 5); // Normalize to 0-1
      bars.push(height);
    }
    
    setAudioVisualizerData(bars);
    
    // Call external callback if provided
    if (onAudioVisualizerRef.current) {
      onAudioVisualizerRef.current(bars);
    }
  }, []);

  // Stop current audio playback
  const stopCurrentAudio = useCallback(() => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        console.log('🎙️ Stopped previous audio (barge-in)');
      } catch (e) {
        // Audio might have already ended naturally
      }
      currentAudioSourceRef.current = null;
      // Notify consumers that playback ended
      try { if (onAudioChunkRef.current) onAudioChunkRef.current({ type: 'end' }); } catch {}
    }
  }, []);

  // Play audio chunk
  const playAudioChunk = useCallback(async (audioBase64) => {
    try {
      stopCurrentAudio();
      
      const audioData = atob(audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioArray.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      currentAudioSourceRef.current = source;
      
      source.onended = () => {
        if (currentAudioSourceRef.current === source) {
          currentAudioSourceRef.current = null;
        }
        // Emit end event when actual playback finishes
        try { if (onAudioChunkRef.current) onAudioChunkRef.current({ type: 'end' }); } catch {}
      };
      
      // Start playback first
      source.start();
      console.log('🎙️ Playing TTS audio');
      
      // Only emit start event after successful start and if AudioContext is running
      setTimeout(() => {
        try {
          if (audioContextRef.current?.state === 'running' && currentAudioSourceRef.current === source) {
            if (onAudioChunkRef.current) onAudioChunkRef.current({ type: 'start' });
          }
        } catch {}
      }, 50); // Small delay to ensure audio actually started
      
    } catch (error) {
      console.error('🎙️ Error playing audio:', error);
      // Emit end on error to unblock UI/visemes
      try { if (onAudioChunkRef.current) onAudioChunkRef.current({ type: 'end' }); } catch {}
    }
  }, [stopCurrentAudio]);

  // Toggle voice chat
  const toggleVoiceChat = useCallback(async () => {
    if (!isRecording) {
      await startVoiceChat();
    } else {
      stopVoiceChat();
    }
  }, [isRecording, startVoiceChat, stopVoiceChat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    isRecording,
    vadActive,
    latency,
    
    // Actions
    connect,
    disconnect,
    startVoiceChat,
    stopVoiceChat,
    toggleVoiceChat,
    setCallbacks,
    
    // Status helpers
    updateStatus,
    
    // Audio visualization
    audioVisualizerData,
    updateAudioVisualizer
  };
};
