# UAV License Manager

A professional web application for managing UAV pilot licenses and health certificates with automated expiry tracking and notifications.

## Features

- 📋 **License Management**: Track Internal and External UAV pilot licenses
- 🏥 **Health Certificates**: Manage medical certificates for pilots
- ⚠️ **Expiry Alerts**: Automated notifications for expiring documents
- 📊 **Dashboard**: Real-time overview of compliance status
- 🔐 **Authentication**: Secure user management with Firebase Auth
- 📱 **Responsive Design**: Professional black and white theme for work environments
- 🌐 **Real-time Updates**: Live data synchronization across devices

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with professional theme
│   ├── page.tsx                # Dashboard page
│   ├── licenses/
│   │   └── page.tsx           # License management page
│   ├── certificates/
│   │   └── page.tsx           # Certificate management page
│   └── globals.css            # Global styles
├── lib/
│   ├── firebase.ts            # Firebase configuration
│   └── utils.ts               # Utility functions
└── types/
    └── index.ts               # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project set up
- Git installed

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uav-license-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Authentication
   - Enable Storage
   - Copy your Firebase configuration

4. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Dashboard
- Overview of all licenses and certificates
- Quick stats on compliance rates
- Upcoming expiration alerts
- Recent activity feed

### License Management
- Add new UAV pilot licenses (Internal/External)
- Edit existing license information
- Track expiry dates and renewal status
- Upload license documents

### Certificate Management
- Manage health certificates (Class 1, 2, 3)
- Track medical examiner information
- Monitor certificate validity
- Set up renewal reminders

## Database Schema

### Users Collection
```typescript
{
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  updatedAt: Date
}
```

### Licenses Collection
```typescript
{
  id: string
  userId: string
  type: 'internal' | 'external'
  licenseNumber: string
  issuedDate: Date
  expiryDate: Date
  issuingAuthority: string
  status: 'active' | 'expired' | 'suspended'
  documentUrl?: string
  notes?: string
}
```

### Certificates Collection
```typescript
{
  id: string
  userId: string
  certificateNumber: string
  issuedDate: Date
  expiryDate: Date
  issuingDoctor: string
  medicalFacility: string
  status: 'valid' | 'expired' | 'revoked'
  documentUrl?: string
  notes?: string
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Standards

- Use TypeScript for all components
- Follow Next.js 14 App Router conventions
- Use Tailwind CSS for styling
- Implement proper error handling
- Write clean, documented code

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
   - Import your project at [vercel.com](https://vercel.com)
   - Connect your Git repository

2. **Configure environment variables**
   - Add all Firebase configuration variables
   - Set up production environment variables

3. **Deploy**
   - Vercel will automatically build and deploy your application

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact the development team or create an issue in the repository.

---

**UAV License Manager** - Professional license and certificate management for aviation professionals.
