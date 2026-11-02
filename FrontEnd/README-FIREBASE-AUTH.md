# SpookyMart Google and Facebook Login

This project uses Firebase Authentication in the React/Vite frontend and verifies Firebase ID tokens in the existing Express/MongoDB backend. The existing email/password login and JWT cookie session remain in place.

## 1. Configure Firebase

1. Create or open a project in the Firebase Console.
2. Add a Web app and copy its configuration.
3. In **Authentication → Sign-in method**, enable **Google** and **Facebook**.
4. For Facebook, create a Meta developer app, enable Facebook Login, and copy its App ID and App Secret into the Facebook provider settings in Firebase.
5. In **Authentication → Settings → Authorized domains**, add your local and deployed website domains.

## 2. Frontend environment

Create/update `FrontEnd/.env` using the values from your Firebase Web app:

```env
VITE_API=http://localhost:4001/api/v1
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-web-app-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
```

Install dependencies and start the frontend:

```bash
cd FrontEnd
npm install
npm run dev
```

## 3. Backend environment

Copy `BackEnd/config/.env.example` to `BackEnd/config/.env`, then add the Firebase project ID:

```env
FIREBASE_PROJECT_ID=your-project-id
```

The backend verifies the Firebase ID token signature, issuer, audience, and expiry against Google's published Firebase signing certificates. It then creates or finds the matching MongoDB user and issues the same SpookyMart JWT cookie used by regular login.

Install dependencies and restart the backend:

```bash
cd BackEnd
npm install
node server.js
```

## 4. Test

1. Open `http://localhost:5173/login`.
2. Test **Continue with Google**.
3. Sign out, then test **Continue with Facebook**.
4. Confirm the user appears in MongoDB and the website header shows the signed-in user.
5. Test the existing email/password login to confirm it still works.

New social accounts get a MongoDB user record and a customer profile. Existing accounts with the same verified email are linked to the social sign-in. Social login does not change the existing password or role. New users receive the default `user` role.

**Important:** Never commit real Firebase credentials, Meta App Secrets, or backend environment files.