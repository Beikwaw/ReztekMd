# RezTek My Domain Living

A Next.js application for managing tenant maintenance requests and admin analytics for My Domain Living residences.

## Features

- **Tenant Portal**
  - Submit maintenance requests with image uploads
  - View request history and status
  - Provide feedback on completed maintenance requests

- **Admin Portal**
  - View and manage maintenance requests
  - Update request status
  - View analytics dashboard with charts
  - Export reports to PDF

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/reztekv15.git
   cd reztekv15
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following variables (replace with your own values):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Set up Firebase service account:
   - Create a `serviceAccountKey.json` file in the `lib` directory
   - Use the template from `lib/serviceAccountExample.json` and fill in your Firebase service account details

### Running the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Environment Variables

### Client-side Firebase Variables
Add these to your `.env.local` file for local development and to your Vercel project settings for deployment:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Server-side Firebase Admin Variables
Add these to your Vercel project settings for deployment (these are used instead of the serviceAccountKey.json file):

```
FIREBASE_ADMIN_PROJECT_ID=reztek-my-domain-living
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@reztek-my-domain-living.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key here with \n for line breaks\n-----END PRIVATE KEY-----\n
```

To get these values:
1. Go to your Firebase project settings
2. Navigate to "Service accounts"
3. Click "Generate new private key"
4. Use the values from the downloaded JSON file

**Important:** When adding the private key to Vercel, make sure to replace all newlines with `\n` characters.

## Firebase Configuration

This application uses Firebase for:
- Authentication
- Firestore Database
- Storage (for maintenance request images)

Make sure to set up the appropriate security rules in your Firebase console.

## Deployment

This project can be deployed to Vercel or any other Next.js-compatible hosting service.

## License

[MIT](LICENSE)
