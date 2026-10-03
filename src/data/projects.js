/**
 * Projects Data
 * Easy to update, clearly structured for expansion and detail view.
 * All project statuses are honest and reflect student learning/development stages.
 */

export const projects = [
  {
    id: "ai-interview-coach",
    number: "01",
    featured: true,
    title: "AI Interview Coach",
    tagline: "Multimodal Interview Simulation & Feedback Assistant",
    shortDescription: "An AI-assisted simulation platform exploring real-time interview performance analysis through voice metrics, visual cues, and resume contextualization.",
    status: "In Development",
    statusType: "active", // active, completed, concept
    technologies: [
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "MediaPipe",
      "Speech Processing",
      "Python"
    ],
    github: "https://github.com/shubhamdhakre/ai-interview-coach", // placeholder - easily replaced
    demo: null, // marked as in-development
    details: {
      problem: "Preparing for technical and behavioral interviews can be intimidating. Candidates often lack objective, low-stress environments to practice speech pacing, reduce verbal fillers, and evaluate their communication presence.",
      idea: "Design an intelligent practice chamber that listens, observes, and provides constructive post-session insights without replacing human judgment.",
      technologiesBreakdown: "React frontend for real-time video/audio capture; Node & Express API handling user profiles and session history; MongoDB for question banks; Python helper services evaluating pitch and facial landmark tracking via MediaPipe.",
      features: [
        { name: "Voice & Speech Analysis", state: "In Development", note: "Exploring pitch, volume consistency, and filler word detection (um, ah, like)." },
        { name: "Pacing & Pause Metrics", state: "In Development", note: "Tracking words-per-minute (WPM) and prolonged silence duration." },
        { name: "Face & Gaze Alignment", state: "Exploring", note: "Initial experiments using MediaPipe landmarks for eye contact consistency." },
        { name: "Resume & Question Context", state: "Planned", note: "Parsing uploaded resumes to dynamically generate role-tailored interview questions." },
        { name: "Session Summary Dashboard", state: "In Development", note: "Visualizing improvement areas with actionable, supportive feedback." }
      ],
      currentStatus: "Currently prototyping core audio stream processing and webcam landmark visualization. Core architecture is being built iteratively."
    }
  },
  {
    id: "interactive-portfolio",
    number: "02",
    featured: false,
    title: "Glass Workspace Portfolio",
    tagline: "High-Performance Interactive Three.js Portfolio",
    shortDescription: "A custom personal digital workspace built with vanilla CSS glassmorphism, Three.js 3D core, dynamic day/night theme engine, and constellation-style skills graph.",
    status: "Live Project",
    statusType: "completed",
    technologies: [
      "React.js",
      "Three.js",
      "Vanilla CSS",
      "JavaScript",
      "HTML5"
    ],
    github: "https://github.com/shubhamdhakre/portfolio",
    demo: "#",
    details: {
      problem: "Traditional portfolios rely on heavy third-party UI libraries and cookie-cutter templates that conceal how web technologies actually work under the hood.",
      idea: "Build a bespoke, zero-dependency visual interface from scratch using raw CSS variables, React state, and a custom Three.js digital orb.",
      technologiesBreakdown: "Pure React 19 functional components, custom hooks for mouse tracking and theme synchronization, Three.js 3D renderer with procedural geometry, and custom glass tokens.",
      features: [
        { name: "Three.js Digital Glass Core", state: "Implemented", note: "Interactive 3D geometry responding to mouse tilt and scroll." },
        { name: "Day / Night Glass Theme Engine", state: "Implemented", note: "Dual-mode glassmorphic styling persisted via localStorage." },
        { name: "Skill Constellation Graph", state: "Implemented", note: "Interactive linked nodes with dynamic glass tooltips." },
        { name: "Micro-Interactive Lab Experiments", state: "Implemented", note: "Playground cards showcasing live physics and visual concepts." }
      ],
      currentStatus: "Completed and deployed as my personal portfolio and living digital workspace."
    }
  },
  {
    id: "dev-learning-journal",
    number: "03",
    featured: false,
    title: "DevLog & Code Notes",
    tagline: "Markdown-Powered Learning & Snippet Tracker",
    shortDescription: "A lightweight web tool designed for Computer Science students to document daily coding learnings, algorithmic patterns, and debug logs.",
    status: "Learning Project",
    statusType: "completed",
    technologies: [
      "React.js",
      "JavaScript",
      "CSS3",
      "Local Storage"
    ],
    github: "https://github.com/shubhamdhakre",
    demo: null,
    details: {
      problem: "Keeping track of daily concepts learned in data structures, algorithms, and web APIs often gets lost across scattered browser tabs and text files.",
      idea: "A focused, distraction-free markdown note-taker with category tagging, search filtering, and code snippet highlighting.",
      technologiesBreakdown: "React state for instant search filtering, local storage for lightweight client-side persistence, and custom CSS code blocks.",
      features: [
        { name: "Tag & Topic Filtering", state: "Implemented", note: "Organize notes by JavaScript, React, Python, or DSA concepts." },
        { name: "Instant Live Search", state: "Implemented", note: "Filter past code solutions in real-time." },
        { name: "Quick Snippet Copy", state: "Implemented", note: "One-click copy for reusable boilerplate." }
      ],
      currentStatus: "Used personally to organize course notes and web development concepts."
    }
  },
  {
    id: "api-endpoint-sandbox",
    number: "04",
    featured: false,
    title: "RESTful API Explorer",
    tagline: "Minimalist HTTP Request Tester & Mock Server",
    shortDescription: "A learning exercise building a mini Postman-like interface to send GET/POST requests, inspect JSON responses, and understand HTTP headers.",
    status: "Exploring",
    statusType: "concept",
    technologies: [
      "Node.js",
      "Express.js",
      "JavaScript",
      "CSS3"
    ],
    github: "https://github.com/shubhamdhakre",
    demo: null,
    details: {
      problem: "Learning how backend APIs communicate with frontend clients is best understood by building an inspection tool from scratch.",
      idea: "Create an Express backend paired with a straightforward frontend to dispatch asynchronous fetch requests, parse headers, and format JSON payloads.",
      technologiesBreakdown: "Node.js and Express server with custom middleware for logging; simple frontend UI for drafting payloads and observing status codes.",
      features: [
        { name: "Request Method Switcher", state: "Implemented", note: "Switch between GET, POST, PUT, DELETE with body inputs." },
        { name: "Status Code Explainer", state: "Implemented", note: "Educational tooltips detailing 200, 201, 400, 404, and 500 behaviors." },
        { name: "JSON Response Beautifier", state: "Implemented", note: "Syntax-highlighted preview of returned backend data." }
      ],
      currentStatus: "Active exploration sandbox for mastering Express middleware and HTTP semantics."
    }
  }
];

export default projects;
