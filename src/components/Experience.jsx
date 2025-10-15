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
import { VoiceChatPanel } from "./VoiceChatPanel";
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
  const { chat, loading, chatHistory, setChatHistory, startTTS, stopTTS } = useChat();

  // Language state (for voice chat)
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  
  // Voice chat state (moved to right side)
  const [isVoiceChatVisible, setIsVoiceChatVisible] = useState(true);
  const [partialTranscript, setPartialTranscript] = useState("");

  // Language label for voice chat
  const selectedLanguageLabel = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || "English";
  }, [selectedLanguage]);

  // Voice chat integration handlers
  const handleVoiceTranscript = async (text, isPartial) => {
    if (isPartial) {
      setPartialTranscript(text);
    } else {
      setPartialTranscript("");
      console.log('🎙️ Final transcript received in Experience:', text);
      
      // Note: The voice backend should automatically process this transcript
      // and send back a response. We don't need to send it to the regular chat system
      // unless the voice backend doesn't handle it.
      
      // Uncomment the line below if you want to also send to regular chat backend:
      // await chat(text, selectedLanguage);
    }
  };

  const handleVoiceResponse = (text) => {
    // Voice responses are already handled by the voice chat system
    // and integrated with the Avatar through the existing message system
    console.log('🎙️ Voice response received in Experience:', text);
    
    // The voice backend should send this response with audio
    // If you want to also integrate with the Avatar, you can process it here
  };

  const handleVoiceAudioChunk = (evt) => {
    // evt may be a string (legacy) or an object { type: 'start'|'end', audio?: base64 }
    try {
      if (typeof evt === 'string') {
        // audio base64 (legacy) -> consider as start of playback
        console.log('Voice audio chunk (legacy string) received');
        startTTS();
        return;
      }
      if (!evt || !evt.type) {
        console.log('Voice audio event without type');
        return;
      }
      if (evt.type === 'start') {
        console.log('Voice audio playback start');
        startTTS();
      } else if (evt.type === 'end') {
        console.log('Voice audio playback end');
        stopTTS();
      }
    } catch (e) {
      console.error('Error handling voice audio event:', e);
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

  // Old speech recognition functions removed - now handled by voice chat system


  return (
    <>
      {/* <CourseDropdown /> */}

      {/* Voice Chat Panel - Moved to Right Side */}
      <VoiceChatPanel
        onTranscript={handleVoiceTranscript}
        onResponse={handleVoiceResponse}
        onAudioChunk={handleVoiceAudioChunk}
        isVisible={isVoiceChatVisible}
        onToggleVisibility={() => setIsVoiceChatVisible(!isVoiceChatVisible)}
        position="right"
      />
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
