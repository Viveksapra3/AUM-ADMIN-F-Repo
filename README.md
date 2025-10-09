# Professor AI - 3D Language Teacher Application

## Overview
Professor AI is an immersive 3D language learning application built with Next.js, React Three Fiber, and AI-powered conversation capabilities. The application features a 3D avatar teacher that can speak, animate, and provide personalized language instruction.

## Architecture Overview

### Core Components Structure
```
src/
├── app/
│   ├── page.js                 # Main application entry point
│   ├── layout.js              # App layout and metadata
│   └── api/
│       ├── courses/route.js   # Course management API
│       ├── ai/route.js        # AI conversation API
│       └── tts/route.js       # Text-to-speech API
├── components/
│   ├── Experience.jsx         # Main 3D scene container
│   ├── Avatar.jsx            # 3D avatar with animations
│   ├── CourseDropdown.jsx    # Course selection UI
│   ├── TypingBox.jsx         # User input interface
│   ├── MessagesList.jsx      # Chat history display
│   └── Teacher.jsx           # Alternative teacher component
└── hooks/
    ├── useChat.jsx           # Chat state management
    └── useAITeacher.js       # AI teacher state management
```

## Animation and Message Flow Documentation

### 1. Application Initialization Flow

#### Step 1: Page Load
```
page.js → ChatProvider → Experience.jsx
```
- **page.js** initializes with loading screen
- **ChatProvider** sets up chat context and state management
- **Experience.jsx** renders 3D scene and UI components

#### Step 2: Component Mounting
```
Experience.jsx renders:
├── CourseDropdown (top-left)
├── TypingBox (bottom center)
├── 3D Canvas
│   ├── Avatar (3D character)
│   ├── Classroom environment
│   └── MessagesList (floating UI)
```

### 2. User Interaction Flow

#### Course Selection Flow
```
1. CourseDropdown.jsx fetches courses from /api/courses
2. User selects a course
3. Course data is stored in component state
4. UI updates to show selected course
```

**API Call Sequence:**
```javascript
GET /api/courses → Returns course list
POST /api/courses → Handles course selection
```

#### Chat Interaction Flow
```
1. User types message in TypingBox
2. TypingBox calls useChat.chat()
3. Message sent to /api/ai
4. AI generates response with:
   - Text content
   - Animation instructions
   - Facial expression data
   - Audio data (base64)
5. Avatar receives message and plays:
   - Audio speech
   - Lip sync animation
   - Facial expressions
   - Body animations
```

### 3. Avatar Animation System

#### Animation States
The Avatar component manages multiple animation layers:

```javascript
Animation Types:
├── Body Animations
│   ├── Idle (default state)
│   ├── Speaking
│   ├── Gesturing
│   └── Custom animations from AI response
├── Facial Expressions
│   ├── Default
│   ├── Happy
│   ├── Surprised
│   ├── Thinking
│   └── Custom expressions
└── Micro Animations
    ├── Eye blinking (automatic)
    ├── Eye winking (triggered)
    └── Lip sync (audio-driven)
```

#### Animation Trigger Sequence
```
1. Message received from AI API
2. Avatar.jsx processes message data:
   - Sets animation state
   - Sets facial expression
   - Prepares lip sync data
3. Audio playback begins
4. Animations synchronize with audio:
   - Body animation plays
   - Facial expression applied
   - Lip sync follows audio phonemes
5. Animation cleanup on audio end
```

### 4. State Management Flow

#### Chat State (useChat.jsx)
```javascript
State Variables:
├── messages: Array of chat messages
├── message: Current playing message
├── loading: API call status
└── cameraZoomed: Camera state

State Flow:
User Input → API Call → Message Queue → Avatar Playback → Cleanup
```

#### AI Teacher State (useAITeacher.js)
```javascript
State Variables:
├── teacher: Selected teacher type
├── classroom: Classroom environment
├── currentMessage: Active message
└── loading: Processing status
```

### 5. 3D Scene Management

#### Camera System
```javascript
Camera States:
├── default: [0, 0, 0.0001] - Overview
├── loading: Zoomed in during processing
└── speaking: Close-up during avatar speech

Camera Transitions:
- Smooth transitions between states
- Zoom levels: 1 (default) to 3 (max)
- Position interpolation for natural movement
```

#### Lighting and Environment
```javascript
Lighting Setup:
├── Environment preset: "studio"
├── Ambient light: Pink tint, 0.8 intensity
└── Dynamic shadows from 3D models
```

### 6. API Endpoints and Data Flow

#### /api/courses
```javascript
GET: Returns available courses
Response: {
  success: boolean,
  courses: [
    {
      id: string,
      name: string,
      description: string,
      level: string,
      topics: string[]
    }
  ]
}
```

#### /api/ai
```javascript
POST: Processes user messages
Request: {
  message: string,
  language: string
}
Response: {
  messages: [
    {
      text: string,
      animation: string,
      facialExpression: string,
      audio: string (base64),
      lipsync: {
        mouthCues: [
          {
            start: number,
            end: number,
            value: string
          }
        ]
      }
    }
  ]
}
```

#### /api/tts
```javascript
POST: Converts text to speech
Request: {
  text: string,
  voice: string
}
Response: Audio stream with lip sync data
```

### 7. Message Processing Pipeline

#### Complete Message Flow
```
1. User Input
   ├── TypingBox captures text
   ├── Validates input
   └── Triggers chat function

2. API Processing
   ├── Message sent to /api/ai
   ├── AI generates response
   ├── TTS creates audio
   └── Lip sync data generated

3. Avatar Response
   ├── Message queued in chat state
   ├── Avatar receives message
   ├── Animation state updated
   ├── Audio playback starts
   └── Lip sync synchronized

4. Cleanup
   ├── Audio ends
   ├── Animation resets to idle
   ├── Message removed from queue
   └── Ready for next interaction
```

### 8. Error Handling

#### Error States
```javascript
Error Types:
├── API Failures
│   ├── Network errors
│   ├── Server errors
│   └── Timeout errors
├── Audio Playback Issues
├── 3D Model Loading Failures
└── Animation Errors

Error Recovery:
├── Graceful degradation
├── User feedback
├── Retry mechanisms
└── Fallback states
```

### 9. Performance Optimizations

#### 3D Rendering
- Model preloading for faster startup
- Efficient animation blending
- Optimized camera controls
- Selective rendering updates

#### State Management
- Minimal re-renders
- Efficient state updates
- Memory cleanup for audio
- Component memoization

### 10. User Experience Flow

#### Typical User Session
```
1. App loads with welcome screen
2. Course dropdown appears (top-left)
3. User selects preferred course
4. Avatar appears in 3D scene
5. User types question in bottom input
6. Avatar responds with:
   - Synchronized speech
   - Appropriate animations
   - Facial expressions
7. Conversation continues naturally
8. Messages displayed in floating UI
```

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern browser with WebGL support

### Installation
```bash
npm install
npm run dev
```

### Environment Variables
```
VITE_API_URL=http://localhost:3005
OPENAI_API_KEY=your_openai_key
AZURE_SPEECH_KEY=your_azure_speech_key
```

## Deployment

The easiest way to deploy your Next.js app is to use the [Elestio Platform](https://ellest.io).

