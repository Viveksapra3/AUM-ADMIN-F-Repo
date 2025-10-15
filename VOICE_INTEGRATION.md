# Real-Time Voice Chat Integration

This document explains the real-time voice chat features that have been integrated into your AUM AI Language Teacher application.

## Features Added

### 🎤️ Real-Time Voice Chat
- **Live Speech-to-Text**: Real-time transcription with partial and final results
- **Voice Activity Detection**: Automatic detection of when user starts/stops speaking
- **Text-to-Speech Streaming**: Audio responses streamed in real-time
- **Barge-in Support**: Interrupt AI speech when user starts talking
- **Real-Time Audio Input**: Live microphone input processing and visualization
- **Audio Visualization**: 32-bar frequency visualization from live microphone input
- **Recording Status**: Visual indicators for active audio recording
- **Low Latency**: Optimized for responsive voice interactions with 1024-sample buffer

### 🔧 Technical Implementation

#### New Components
1. **`useVoiceChat` Hook** (`src/hooks/useVoiceChat.js`)
   - Manages WebSocket connection to voice backend (port 8766)
   - Handles real-time audio streaming
   - Processes voice activity detection
   - Manages TTS audio playback with interruption support

2. **`VoiceChatPanel` Component** (`src/components/VoiceChatPanel.jsx`)
   - Modern UI for voice chat controls
   - Real-time conversation display
   - Audio visualization bars
   - Connection status indicators
   - Latency monitoring

3. **Audio Processing Utilities** (`src/utils/audioUtils.js`)
   - Audio format conversion (Float32 → PCM16 → Base64)
   - Real-time audio visualization from live microphone input
   - Voice activity detection algorithms
   - Audio level calculation and frequency analysis

#### Integration Points
- **Experience Component**: Updated to include voice chat panel
- **useChat Hook**: Enhanced to support voice message types
- **Avatar Integration**: Voice responses work with existing 3D avatar

## Backend Requirements

Your voice backend should run on **port 8766** and support these WebSocket message types:

### Messages TO Backend:
```javascript
// Start speech-to-text streaming
{ type: 'stt_stream_start', language: 'en-US' }

// Send audio data (base64 encoded PCM16)
{ type: 'stt_audio_chunk', audio: 'base64_audio_data' }

// Stop speech-to-text streaming
{ type: 'stt_stream_end' }
```

### Messages FROM Backend:
```javascript
// Connection established
{ type: 'connection_ready' }

// STT service ready
{ type: 'stt_ready' }

// User started speaking
{ type: 'speech_started' }

// User stopped speaking
{ type: 'utterance_end' }

// Partial speech recognition
{ type: 'partial_transcript', text: 'partial text...' }

// Final speech recognition
{ type: 'final_transcript', text: 'final transcribed text' }

// AI text response
{ type: 'agent_response', text: 'AI response text' }

// TTS audio chunk (base64 encoded)
{ type: 'audio_chunk', audio: 'base64_audio_data' }

// Audio playback complete
{ type: 'audio_end' }

// Error message
{ type: 'error', message: 'error description' }
```

## Usage Instructions

### 1. Start Your Backend
Make sure your voice backend is running on port 8766:
```bash
# Your backend should be accessible at:
ws://localhost:8766
```

### 2. Use the Voice Chat
1. **Connect**: Click "Connect" button in the voice chat panel
2. **Start Voice Chat**: Click "🎤 Start Voice Chat" to begin recording
3. **Speak Naturally**: The system will detect when you start/stop speaking
4. **Listen**: AI responses will play automatically through TTS
5. **Interrupt**: Start speaking while AI is talking to interrupt (barge-in)

### 3. Visual Indicators
- **Status Bar**: Shows connection and activity status
- **Voice Activity Light**: Green when speech is detected
- **Audio Visualizer**: Real-time audio level bars
- **Latency Display**: Shows response time in milliseconds

## Configuration

### Audio Settings
The system uses optimized audio settings for low latency:
```javascript
{
  sampleRate: 16000,      // 16kHz for speech recognition
  channelCount: 1,        // Mono audio
  echoCancellation: true, // Reduce echo
  noiseSuppression: true, // Reduce background noise
  autoGainControl: true   // Automatic volume adjustment
}
```

### Real-Time Audio Processing
- **Live Input Processing**: Microphone audio processed in real-time
- **Visual Feedback**: 32-bar audio visualizer shows live input levels
- **Recording Indicator**: Visual status when audio is being captured
- **Automatic Cleanup**: Audio streams properly disposed when stopping

### Buffer Size
- **Audio Processing**: 1024 samples (64ms at 16kHz)
- **Visualization**: 32 frequency bars
- **VAD Threshold**: Configurable voice activity detection

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Check browser permissions
   - Ensure HTTPS or localhost
   - Try refreshing the page

2. **WebSocket Connection Failed**
   - Verify backend is running on port 8766
   - Check firewall settings
   - Ensure WebSocket endpoint is accessible

3. **No Audio Playback**
   - Check browser audio permissions
   - Verify speakers/headphones are connected
   - Check audio context initialization

4. **Poor Voice Recognition**
   - Ensure good microphone quality
   - Reduce background noise
   - Speak clearly and at normal pace

### Debug Information
The system logs detailed information to the browser console:
- WebSocket connection status
- Audio processing events
- Voice activity detection
- Message exchanges with backend
- Real-time audio input levels
- Microphone access and permissions

## Integration with Existing Features

### Chat History
- Voice transcripts appear in the regular chat panel
- Seamless integration with existing chat system
- Maintains conversation context

### 3D Avatar
- Voice responses work with existing Avatar component
- Audio playback integrates with avatar animations
- Lip-sync data can be enhanced with voice timing

### Language Support
- Uses existing language selection
- Supports all configured languages
- Voice recognition adapts to selected language

## Performance Optimization

### Low Latency Features
- **1024-sample buffer**: Minimizes processing delay
- **Real-time streaming**: Audio chunks sent immediately
- **Barge-in support**: Instant interruption capability
- **Optimized WebSocket**: Efficient message handling

### Memory Management
- **Automatic cleanup**: Resources freed when not in use
- **Stream management**: Proper audio stream disposal
- **Context reuse**: Audio contexts shared when possible

## Future Enhancements

Potential improvements for the voice system:
1. **Noise Cancellation**: Advanced background noise reduction
2. **Voice Training**: User-specific voice model adaptation
3. **Multi-language Detection**: Automatic language switching
4. **Emotion Recognition**: Detect emotional tone in voice
5. **Voice Cloning**: Custom TTS voices
6. **Offline Mode**: Local speech processing capabilities

## Support

For issues or questions about the voice integration:
1. Check browser console for error messages
2. Verify backend WebSocket endpoint
3. Test microphone permissions
4. Review network connectivity

The voice chat system is designed to work seamlessly with your existing application while providing a modern, responsive voice interaction experience.
