# 🚀 CollabChat Board - Project Summary & Presentation Guide

## 📋 Project Overview
**CollabChat Board** is a production-grade, full-stack real-time collaboration platform. It bridges the gap between creative brainstorming and structured execution by integrating a collaborative whiteboard, instant messaging, and AI-powered insights into a single, unified workspace.

---

## 🛠️ Technical Stack (For AI Context)
*   **Monorepo Architecture:** Managed via npm workspaces for clean separation of concerns.
    *   `client/`: React 18 + Vite + Tailwind CSS + Zustand.
    *   `server/`: Node.js + Express + Prisma ORM + Socket.IO.
    *   `packages/shared/`: Shared TypeScript types and Zod schemas (100% type safety across the network).
*   **Database:** PostgreSQL (Relational schema with 6 core models: Users, Rooms, Members, Messages, Snapshots, AI Logs).
*   **Real-Time Engine:** Socket.IO with room-scoped broadcasting for efficient state synchronization.
*   **Canvas Engine:** Fabric.js for vector-based collaborative drawing.
*   **Security:** JWT-based authentication, bcryptjs password hashing, and Zod input validation.

---

## ✨ Key Features
1.  **Real-Time Collaborative Whiteboard:**
    *   Vector-based drawing (shapes, freehand, text).
    *   Instant state sync across all participants.
    *   Persistent snapshots for room rehydration.
2.  **Synchronized Chat & Presence:**
    *   Room-based messaging with full history.
    *   Real-time typing indicators and presence avatars.
    *   Member management via unique invite codes.
3.  **AI Intelligence (The "Brain"):**
    *   **Summarization:** Condenses room history into executive summaries.
    *   **Action Extraction:** Identifies tasks and priorities from chat logs.
    *   **Diagram Suggestions:** Recommends visual structures based on board content.
    *   **Project Planning:** Generates roadmaps from collaborative sessions.

---

## 🏗️ Architectural Highlights
*   **Type-Safe Contracts:** Every API call and Socket event is typed. If the backend changes, the frontend won't compile until updated—preventing production bugs.
*   **Modular Services:** The backend is organized into domain-specific services (Auth, Room, AI, etc.), making it highly extensible.
*   **Responsive UX:** Features a "Mobile-First" tabbed interface that expands into a multi-panel "Command Center" on desktop.

---

## 🎤 Presentation Talking Points
*   **The Problem:** Teams waste time switching between whiteboards (Miro), chat (Slack), and AI (ChatGPT). Context is lost in the gaps.
*   **The Solution:** CollabChat Board brings these tools into one room where data flows freely between them.
*   **Developer Edge:** *"By using a shared type package, we've eliminated the 'guesswork' between frontend and backend teams, allowing us to build features 2x faster with zero integration bugs."*
*   **The Future:** Potential for OpenAI integration to turn rough whiteboard sketches into polished architectural diagrams automatically.

---

## 📂 Key Files for AI Analysis
*   `server/prisma/schema.prisma`: The "Single Source of Truth" for our data.
*   `packages/shared/src/types.ts`: The contract defining all network communication.
*   `server/src/socket.ts`: The heartbeat of real-time synchronization.
*   `client/src/stores/`: How we manage complex application state.

---
*Created by Gemini CLI for the CollabChat Board Project.*
