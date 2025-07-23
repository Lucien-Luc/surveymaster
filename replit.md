# SurveyFlow - Survey Builder Application

## Overview

SurveyFlow is a modern survey builder and management platform that allows users to create, distribute, and analyze surveys. The application features a React frontend with TypeScript, Firebase authentication and data storage, and a comprehensive survey building interface with real-time preview capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: Firebase Firestore for real-time data storage
- **Authentication**: Firebase Auth with Google OAuth integration
- **ORM**: Drizzle ORM configured for PostgreSQL (though currently using Firebase)
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)

### Database Design
The application uses Firebase Firestore with the following main collections:
- **surveys**: Store survey metadata, questions, and configuration
- **responses**: Store individual survey responses and analytics data
- **users**: User profiles and authentication data (managed by Firebase Auth)

## Key Components

### Survey Builder
- **Form Builder**: Visual drag-and-drop interface for creating surveys
- **Question Types**: Support for text, textarea, multiple choice, checkbox, rating, date, and email questions
- **Preview Mode**: Real-time preview of surveys as users build them
- **Skip Logic**: Conditional question flow based on previous answers
- **Validation**: Client-side form validation with custom rules

### Authentication System
- **Firebase Auth**: Google OAuth integration for secure authentication
- **Auth Guards**: Protected routes requiring authentication
- **Session Management**: Persistent login state across browser sessions

### Survey Management
- **Dashboard**: Overview of all surveys with statistics
- **Survey List**: Comprehensive list with status indicators and quick actions
- **Response Analytics**: Real-time response tracking and data visualization
- **Export Functionality**: CSV export of survey responses

### UI/UX Features
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark Mode Support**: CSS variables for theme switching
- **Component Library**: Comprehensive shadcn/ui component system
- **Loading States**: Skeleton loaders and spinners for better UX

## Data Flow

### Survey Creation Flow
1. User authenticates via Firebase Auth
2. Survey Builder creates survey object with questions array
3. Data is saved to Firestore with user ownership
4. Real-time updates sync across components via TanStack Query

### Survey Response Flow
1. Public survey link accessed (no auth required)
2. Survey data fetched from Firestore
3. Responses collected and validated client-side
4. Complete responses saved to Firestore with analytics metadata
5. Real-time dashboard updates for survey owners

### Authentication Flow
1. User clicks Google Sign In
2. Firebase Auth handles OAuth flow
3. User state managed via React context
4. Protected routes check authentication status
5. Persistent sessions maintained across browser refreshes

## External Dependencies

### Core Dependencies
- **Firebase**: Authentication, Firestore database, hosting
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **date-fns**: Date formatting and manipulation
- **nanoid**: Unique ID generation for surveys and questions

### UI Dependencies
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant styling
- **embla-carousel**: Touch-friendly carousel component

### Development Dependencies
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety and developer experience
- **PostCSS**: CSS processing and optimization
- **ESBuild**: Fast JavaScript bundling

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for rapid development
- **Firebase Emulators**: Local development with Firestore emulator
- **Replit Integration**: Built-in development environment support

### Production Build
- **Vite Build**: Optimized production bundle with code splitting
- **Static Asset Hosting**: Client files served via CDN
- **Express Server**: API routes and static file serving
- **Environment Variables**: Firebase configuration and API keys

### Database Considerations
The application is configured for both Firebase Firestore (current) and PostgreSQL (via Drizzle ORM). The dual setup allows for:
- **Current Implementation**: Firebase for rapid development and real-time features
- **Future Migration**: PostgreSQL option for enterprise deployments requiring traditional SQL databases
- **Hybrid Approach**: Potential use of both systems for different data types

### Scalability Features
- **Real-time Updates**: Firestore listeners for live survey analytics
- **Caching Strategy**: TanStack Query for optimistic updates and background synchronization
- **Component Lazy Loading**: Code splitting for improved performance
- **Image Optimization**: Vite asset optimization and compression