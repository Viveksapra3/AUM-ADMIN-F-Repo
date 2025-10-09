"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import {
  CameraControls,
  Environment,
  Float,
  Gltf,
  Html,
  Loader,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva, button, useControls } from "leva";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { degToRad } from "three/src/math/MathUtils";
import { BoardSettings } from "./BoardSettings";
import { MessagesList } from "./MessagesList";
import { Teacher } from "./Teacher";
import {Avatar } from "./Avatar";
// import { TypingBox } from "./TypingBox";
import { CourseDropdown } from "./CourseDropdown";
// import { LastChat } from "./LastChat";

const itemPlacement = {
  default: {
    classroom: {
      position: [0.2, -1.7, 1],
    },
    avatar: {
      position: [-1, -1.7, -6],
    },
    board: {
      position: [0.45, 0.382, -3],
    },
  },
  alternative: {
    classroom: {
      position: [0.3, -1.7, -1.5],
      rotation: [0, degToRad(-90), 0],
      scale: 0.4,
    },
    teacher: { position: [-1, -1.7, -3] },
    board: { position: [1.4, 0.84, -8] },
  },
};

import { useChat, SUPPORTED_LANGUAGES } from "@/hooks/useChat";

export const Experience = () => {
  const teacher = useAITeacher((state) => state.teacher);
  const classroom = useAITeacher((state) => state.classroom);
  const { chat, loading, chatHistory, setChatHistory } = useChat();

  // Chat UI state
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [question, setQuestion] = useState("");
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const selectedLanguageLabel = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || "English";
  }, [selectedLanguage]);

  const sendQuestion = async () => {
    const q = question.trim();
    if (!q) return;
    
    setQuestion("");
    
    // Call backend via useChat with selected language
    // The chat function now handles adding messages to chatHistory automatically
    try {
      await chat(q, selectedLanguage);
    } catch (error) {
      console.error('Error sending question:', error);
    }
  };

  // // Fetch courses and user session on component mount
  // useEffect(() => {
  //   const fetchCoursesAndSession = async () => {
  //     setCoursesLoading(true);
  //     try {
  //       const apiBase = process.env.NEXT_PUBLIC_NEXT_WEB_API || 'http://localhost:3000';
        
  //       // First, get user session to get course ID
  //       const sessionResponse = await fetch(`${apiBase}/api/session`, { 
  //         credentials: 'include' 
  //       });
        
  //       if (sessionResponse.ok) {
  //         const sessionData = await sessionResponse.json();
  //         const userCourseId = sessionData?.user?.courseId;
          
  //         if (userCourseId) {
  //           // Fetch the specific course for this user
  //           const courseResponse = await fetch(`${apiBase}/api/course/${userCourseId}`, {
  //             credentials: 'include'
  //           });
            
  //           if (courseResponse.ok) {
  //             const courseData = await courseResponse.json();
  //             setCourses([courseData]); // Set as array with single course
  //             setSelectedCourse(courseData); // Auto-select the user's course
  //           }
  //         } else {
  //           // Fallback: fetch all courses if no specific course ID in session
  //           const coursesResponse = await fetch(`${apiBase}/api/courses`, {
  //             credentials: 'include'
  //           });
            
  //           if (coursesResponse.ok) {
  //             const coursesData = await coursesResponse.json();
  //             setCourses(coursesData);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error fetching courses and session:', error);
  //     } finally {
  //       setCoursesLoading(false);
  //     }
  //   };

  //   fetchCoursesAndSession();
  // }, []);

  // // Fetch course details when a course is selected (if not already loaded)
  // useEffect(() => {
  //   if (selectedCourse && selectedCourse.id && !selectedCourse.modules) {
  //     const fetchCourseDetails = async () => {
  //       try {
  //         const apiBase = process.env.NEXT_PUBLIC_NEXT_WEB_API || 'http://localhost:3000';
  //         const response = await fetch(`${apiBase}/api/course/${selectedCourse.id}`, {
  //           credentials: 'include'
  //         });
  //         if (response.ok) {
  //           const courseDetails = await response.json();
  //           setSelectedCourse(courseDetails);
  //         }
  //       } catch (error) {
  //         console.error('Error fetching course details:', error);
  //       }
  //     };

  //     fetchCourseDetails();
  //   }
  // }, [selectedCourse]);

  // Voice recording functions using Web Speech API
  const startRecording = async () => {
    try {
      // Check if Web Speech API is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage || 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        setQuestion(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        alert(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };

      // Start recognition
      recognition.start();
      setMediaRecorder(recognition);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Could not start speech recognition. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && typeof mediaRecorder.stop === 'function') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };


  return (
    <>
      {/* <CourseDropdown /> */}

      {/* Chat toggle button (when hidden) */}
      {!isChatVisible && (
        <button
          onClick={() => setIsChatVisible(true)}
          className="fixed top-4 right-4 z-20 bg-blue-500/80 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg backdrop-blur-sm border border-white/20 transition-all"
          title="Show Chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </button>
      )}

      {/* Right sidebar: Language select, Chat history, and Input */}
      {isChatVisible && (
        <div className="z-10 fixed top-4 right-4 bottom-4 w-full sm:w-[380px] md:w-[420px] flex">
          <div className="flex h-full w-full flex-col bg-gradient-to-tr from-slate-600 via-gray-600 to-slate-600 border border-slate-100 shadow-xl rounded-xl">
            {/* Controls row with hide button */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/90 text-lg font-semibold">Chat</h3>
                <button
                  onClick={() => setIsChatVisible(false)}
                  className="text-white/60 hover:text-white/90 p-1 rounded transition-colors"
                  title="Hide Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-white/80 text-sm">Language:</label>
                  <select
                    className="bg-slate-900/60 text-white px-3 py-2 rounded-md border border-white/20"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-white/60">Selected: {selectedLanguageLabel}</span>
              </div>
              <div className="text-xs text-white/60 hidden sm:block">
              </div>
            </div> */}
          </div>

          {/* Chat history (fills available space) */}
          <div className="flex-1 overflow-y-auto bg-black/20 p-3 border-b border-white/10">
            {chatHistory.length === 0 ? (
              <div className="text-white/50 text-sm">No messages yet. Ask something below.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {chatHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-sm shadow border
                        ${m.role === "user" ? "bg-emerald-500/80 text-white border-emerald-300/30" : "bg-white/10 text-white border-white/10"}
                      `}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input row (sticks to bottom) */}
          <div className="p-3 flex gap-2 items-center">
            {/* Microphone button */}
            <button
              className={`p-2 rounded-full border border-white/20 transition-all ${
                isRecording 
                  ? "bg-red-500/80 text-white animate-pulse" 
                  : "bg-slate-800/60 text-white/70 hover:text-white hover:bg-slate-700/60"
              }`}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? "Stop Recording" : "Start Voice Recording"}
            >
              {isRecording ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            
            <input
              className="flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60 focus:outline focus:outline-white/60"
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendQuestion(); }}
            />
            <button
              className={`px-5 py-2 rounded-full text-white border border-white/20 ${loading ? "bg-white/20 cursor-not-allowed" : "bg-slate-100/20 hover:bg-slate-100/30"}`}
              onClick={sendQuestion}
              disabled={loading}
              title={loading ? "Sending..." : "Ask"}
            >
              {loading ? "Sending..." : "Ask"}
            </button>
          </div>
          </div>
        </div>
      )}
      <Leva hidden={true}   />
      <Loader />
      <Canvas
        camera={{
          position: [0, 0,1/10000000000],
        }}
        performance={{ min: 0.5 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <CameraManager />

        <Suspense>
          <Float speed={1} floatIntensity={0.2} rotationIntensity={0}>
            {/* Logo anchored to the board position and lifted above it */}
            <group {...itemPlacement[classroom].board}>
              <Html
                transform
                position={[0, .85, 0]}
                distanceFactor={1}
                zIndexRange={[100, 100]}
                scale={1.3}
                style={{ pointerEvents: 'none' }}
              >
                <img
                  src="/prof-ai-logo_1755775207766.avif"
                  alt="professor ai logo"
                  className="h-12 sm:h-16 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] select-none"
                />
              </Html>
            </group>
            {/* <Html
              transform
              position={[0, 1, 0]}
              {...itemPlacement[classroom].board}
              distanceFactor={1}
            >
              <MessagesList />
              <BoardSettings />
            </Html> */}
            
            {/* LastChat positioned on the right side */}
            {/* <Html
              position={[0, 1, 0]}
              transform
              distanceFactor={1}
            >
              <div style={{ width: '300px' }}>
                <LastChat />
              </div>
            </Html> */}
            <Environment preset="sunset" background={false}/>
            <ambientLight intensity={0.8} color="pink" />

            <Gltf
              src={`/models/classroom_${classroom}.glb`}
              {...itemPlacement[classroom].classroom}
            />
            {/* <Teacher
              teacher={teacher}
              key={teacher}
              {...itemPlacement[classroom].teacher}
              scale={1.5}
              rotation-y={degToRad(20)}
            /> */}
          </Float>
          
          {/* Avatar outside Float to prevent animation conflicts */}
          <Avatar position={[0,-1.3,-0.7]}
          scale={0.85}
          rotation-y={degToRad(0)}
          />
        </Suspense>
      </Canvas>
    </>
  );
};

const CAMERA_POSITIONS = {
  default: [2, 6.123233995736766e-21, 0.0001],
  loading: [
    0.00002621880610890309, 0.00000515037441056466, 0.00009636414192870058,
  ],
  speaking: [0, -1.6481333940859815e-7, 0.00009999846226827279],
};

const CAMERA_ZOOMS = {
  default: 2,
  loading: 1.3,
  speaking: 2.1204819420055387,
};

const CameraManager = () => {
  const controls = useRef();
  const loading = useAITeacher((state) => state.loading);
  const currentMessage = useAITeacher((state) => state.currentMessage);

  useEffect(() => {
    if (loading) {
      controls.current?.setPosition(...CAMERA_POSITIONS.loading, true);
      controls.current?.zoomTo(CAMERA_ZOOMS.loading, true);
    } else if (currentMessage) {
      controls.current?.setPosition(...CAMERA_POSITIONS.speaking, true);
      controls.current?.zoomTo(CAMERA_ZOOMS.speaking, true);
    }
  }, [loading]);

  useControls("Helper", {
    getCameraPosition: button(() => {
      const position = controls.current.getPosition();
      const zoom = controls.current.camera.zoom;
      console.log([...position], zoom);
    }),
  });

  return (
    <CameraControls 
    // enabled={false}
      ref={controls}
      minZoom={2}
      maxZoom={3}
      polarRotateSpeed={-0.3} // REVERSE FOR NATURAL EFFECT
      azimuthRotateSpeed={-0.3} // REVERSE FOR NATURAL EFFECT
      mouseButtons={{
        left: 1, //ACTION.ROTATE
        wheel: 16, //ACTION.ZOOM
      }}
      touches={{
        one: 32, //ACTION.TOUCH_ROTATE
        two: 512, //ACTION.TOUCH_ZOOM
      }}
    />
  );
};

useGLTF.preload("/models/classroom_default.glb");
useGLTF.preload("/models/classroom_alternative.glb");
