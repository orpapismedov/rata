# UAV License Management System - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a UAV (Unmanned Aerial Vehicle) pilot license and health certificate management system built with Next.js 14, TypeScript, and Tailwind CSS. The system helps manage Internal/External pilot licenses, health certificates, and tracks expiry dates with automated notifications.

## Technical Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with a professional black and white theme
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Animations**: Framer Motion
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React

## Design Guidelines
- Use a professional black and white color scheme suitable for work environments
- Implement clean, modern UI with subtle animations
- Ensure responsive design for desktop and mobile devices
- Use consistent spacing and typography
- Follow accessibility best practices

## Code Standards
- Use TypeScript for all components and utilities
- Follow Next.js 14 App Router conventions
- Implement proper error handling and loading states
- Use server components where appropriate
- Maintain clean component structure with proper separation of concerns

## Key Features to Implement
1. **License Dashboard** - Overview of all pilot licenses and certificates
2. **License Management** - CRUD operations for licenses and certificates
3. **Expiry Tracking** - Visual indicators for expiring documents
4. **Notifications** - Email/SMS alerts for upcoming expirations
5. **Document Storage** - Upload and manage certificate files
6. **Reporting** - Generate compliance and audit reports
7. **User Authentication** - Secure login and user management

## Database Schema
- Users collection with profile information
- Licenses collection with pilot license details
- Certificates collection with health certificate data
- Notifications collection for alert management
- Documents collection for file storage references

## Component Structure
- Use TypeScript interfaces for all props and data structures
- Implement proper loading and error states
- Use Framer Motion for page transitions and micro-interactions
- Follow the compound component pattern for complex UI elements
