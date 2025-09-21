# Task Management (WIP)

This is a full-stack Kanban-style task management application built with modern web technologies to help you organize and track projects with ease.

---

## Project Overview

**trello-next** emulates a Trello-like interface featuring dynamic boards, lists, and draggable cards to streamline project management. Users can create boards, add lists, drag-drop cards within and across lists, and manage tasks intuitively. Real-time data persistence is powered by Supabase, while the frontend leverages React and Next.js to deliver a performant and responsive experience.

---

## Tech Stack

- **Frontend:** Next.js (React 19) with Tailwind CSS  
- **Drag & Drop:** `@dnd-kit` libraries (`core`, `sortable`, `utilities`)  
- **Backend:** Supabase (PostgreSQL) for database and real-time sync  
- **Authentication & Security:** Supabase auth
- **Language:** TypeScript for type safety and scalable development  
- **Bundler & Tooling:** PNPM for package management, ESLint for code quality  

---

## Features

- Create, rename, and delete boards  
- Add lists and cards dynamically per board  
- Drag and drop cards within the same list and between different lists  
- Persist card order and list assignment in real-time with Supabase  
- Responsive UI optimized for desktop and mobile  
- Authentication and data security via Supabase

---

## Getting Started

### Installation

```
git clone https://github.com/ananya-singhB/trello-next.git
cd trello-next
pnpm install
```

### Running the development server

```
pnpm dev
```

Open [http://localhost:3008](http://localhost:3008) in your browser.

---

## Environment Variables

Create a `.env.local` file at the root and add your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---
