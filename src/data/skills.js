/**
 * Tech Stack Constellation Data
 * Categorized and interconnected for the interactive constellation graph.
 * Honest, student-level descriptions without fake percentages.
 * Categories: FRONTEND, BACKEND, DATABASE, TOOLS, EXPLORING
 */

export const skills = [
  // FRONTEND
  {
    id: "react",
    name: "React.js",
    category: "FRONTEND",
    tagline: "Component UI Engine",
    topics: ["Functional Components", "Hooks (useState, useEffect, useRef)", "State Flow & Props", "Virtual DOM"],
    summary: "Building reusable component-driven interfaces, reactive state flows, and modular single-page views.",
    x: 22,
    y: 22,
    connections: ["js", "html", "css", "threejs", "rest"]
  },
  {
    id: "js",
    name: "JavaScript",
    category: "FRONTEND",
    tagline: "Core Web Language",
    topics: ["ES6+ Syntax", "Async / Await & Promises", "DOM & Event Loop", "Closures & Prototypes"],
    summary: "The primary programming language for building dynamic and interactive web logic on client and server.",
    x: 40,
    y: 32,
    connections: ["react", "node", "html", "css", "threejs", "git"]
  },
  {
    id: "html",
    name: "HTML5",
    category: "FRONTEND",
    tagline: "Semantic Markup",
    topics: ["Semantic Document Elements", "Accessible Forms", "Audio & Video Streams", "Canvas API"],
    summary: "Writing clean, accessible semantic document trees that interface cleanly with browser APIs.",
    x: 15,
    y: 45,
    connections: ["css", "js", "react"]
  },
  {
    id: "css",
    name: "CSS3",
    category: "FRONTEND",
    tagline: "Styling & Layout",
    topics: ["Flexbox & CSS Grid", "Custom Properties (Tokens)", "Glassmorphism & Depth", "Transitions & Keyframes"],
    summary: "Crafting bespoke dark glass workspaces, responsive layouts, and fluid micro-interactions.",
    x: 26,
    y: 58,
    connections: ["html", "js", "react"]
  },

  // BACKEND
  {
    id: "node",
    name: "Node.js",
    category: "BACKEND",
    tagline: "V8 Server Runtime",
    topics: ["Event Loop & Callbacks", "File System (fs)", "npm Ecosystem", "HTTP Server Module"],
    summary: "Executing JavaScript on the server side to build backend endpoints and local utility scripts.",
    x: 62,
    y: 24,
    connections: ["js", "express", "mongodb", "rest", "aiml"]
  },
  {
    id: "express",
    name: "Express.js",
    category: "BACKEND",
    tagline: "Server Routing Framework",
    topics: ["REST Route Handlers", "Custom Middleware", "JSON Serialization", "CORS & Error Handlers"],
    summary: "Structuring minimalist and clean HTTP REST APIs with organized routing controllers.",
    x: 78,
    y: 36,
    connections: ["node", "mongodb", "rest"]
  },

  // DATABASE
  {
    id: "mongodb",
    name: "MongoDB",
    category: "DATABASE",
    tagline: "NoSQL Document Store",
    topics: ["Mongoose Schemas", "CRUD Operations", "Document Collections", "Data Aggregation Pipelines"],
    summary: "Managing application records in flexible BSON document collections.",
    x: 85,
    y: 58,
    connections: ["node", "express", "rest"]
  },

  // TOOLS
  {
    id: "rest",
    name: "REST APIs",
    category: "TOOLS",
    tagline: "HTTP API Architecture",
    topics: ["HTTP Methods (GET, POST)", "Status Codes", "JSON Payloads", "Header Management"],
    summary: "Designing predictable client-server contracts with clean asynchronous data handling.",
    x: 52,
    y: 46,
    connections: ["react", "node", "express", "js"]
  },
  {
    id: "git",
    name: "Git",
    category: "TOOLS",
    tagline: "Distributed Version Control",
    topics: ["Commits & Branching", "Merge Conflict Resolution", "Diff Inspections", "Stash & Rebase Basics"],
    summary: "Tracking code revisions, managing experimentation branches, and maintaining version history.",
    x: 18,
    y: 76,
    connections: ["github", "js"]
  },
  {
    id: "github",
    name: "GitHub",
    category: "TOOLS",
    tagline: "Repository & Collaboration",
    topics: ["Remote Repositories", "Issue Tracking", "Pull Requests", "Markdown Documentation"],
    summary: "Publishing project code, tracking bugs, and sharing open source experiments.",
    x: 14,
    y: 88,
    connections: ["git"]
  },

  // EXPLORING
  {
    id: "threejs",
    name: "Three.js",
    category: "EXPLORING",
    tagline: "WebGL 3D Graphics",
    topics: ["Procedural Geometries", "Materials & Shaders", "Camera Math & Frustum", "requestAnimationFrame"],
    summary: "Rendering 3D digital objects, wireframe lattices, and mouse-reactive WebGL scenes.",
    x: 38,
    y: 72,
    connections: ["js", "react"]
  },
  {
    id: "aiml",
    name: "AI / ML",
    category: "EXPLORING",
    tagline: "Applied Intelligence Concepts",
    topics: ["Model Inference APIs", "Feature Extraction", "Speech Audio Metrics", "Prompt Engineering"],
    summary: "Active learning domain: exploring how intelligent algorithms enhance modern web software.",
    x: 58,
    y: 70,
    connections: ["opencv", "mediapipe", "node"]
  },
  {
    id: "mediapipe",
    name: "MediaPipe",
    category: "EXPLORING",
    tagline: "Real-Time ML Pipelines",
    topics: ["Face Mesh Landmarks", "Gaze Estimation", "Pose Tracking", "Webcam Stream Pipelines"],
    summary: "Testing real-time facial and gaze landmark tracking for the AI Interview Coach.",
    x: 78,
    y: 78,
    connections: ["aiml", "opencv"]
  },
  {
    id: "opencv",
    name: "OpenCV",
    category: "EXPLORING",
    tagline: "Computer Vision",
    topics: ["Frame Preprocessing", "Edge & Landmark Detection", "Python Integration", "Video Streams"],
    summary: "Computer vision library used in Python experiments for video stream analysis.",
    x: 64,
    y: 86,
    connections: ["aiml", "mediapipe"]
  }
];

export default skills;
