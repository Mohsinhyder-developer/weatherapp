# Advanced Weather App - Setup Guide

## 🎉 Your Weather App is Ready!

I've successfully integrated your Firebase configuration into the weather app. The app is now fully set up and ready to use!

## ✅ What's Been Configured

### Firebase Integration
Your Firebase project credentials have been added:
- **Project ID**: weatherapp-b2cf7
- **Auth Domain**: weatherapp-b2cf7.firebaseapp.com  
- **Database**: Realtime Database enabled
- **Analytics**: Firebase Analytics configured

### Features Enabled
- ✅ Email/Password Authentication
- ✅ Google Sign-In
- ✅ Firestore Database for user data
- ✅ Weather API (OpenWeatherMap)
- ✅ Offline Support (PWA)
- ✅ Dark/Light Theme
- ✅ Location Services

## 🚀 How to Use the App

### 1. Access the App
The development server should be running at:
```
http://localhost:5173
```

### 2. Sign Up / Sign In
When you first open the app, you'll see the authentication screen:

1. **Sign Up with Email**:
   - Enter your email address
   - Create a password (min 6 characters)
   - Click "Sign Up"

2. **Or use Google Sign-In**:
   - Click "Continue with Google"
   - Select your Google account

### 3. Grant Location Permission
After signing in:
- Click "Allow" when prompted for location access
- This lets the app show weather for your current location

### 4. Explore Features

**Home Tab**:
- View current weather
- See hourly forecast (next 24 hours)
- Check 7-day forecast  
- View Air Quality Index
- See sunrise/sunset times

**Map Tab**:
- Interactive weather map
- View your location
- Explore different areas

**Favorites Tab**:
- Save your favorite cities
- Quick access to their weather
- Swipe to remove cities

**Settings Tab**:
- Toggle dark/light theme
- Change temperature units (°C/°F)
- Change wind speed units (km/h, mph, m/s)
- Manage your account
- Sign out

### 5. Search for Cities
- Use the search bar at the top
- Type any city name
- Select from suggestions
- View weather instantly

## 📱 Install as PWA (Optional)

Make the app feel like a native mobile app:

**On Chrome/Edge**:
1. Click the install icon in the address bar
2. Click "Install"
3. The app will open in its own window

**On Mobile**:
1. Tap the share button
2. Select "Add to Home Screen"
3. Name it and add to your home screen

## 🔧 Troubleshooting

### Blank Screen
If you see a blank screen:
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Check if the dev server is running (`npm run dev`)

### Firebase Errors
If you see authentication errors:
1. Make sure you're online
2. Enable Authentication in Firebase Console:
   - Go to https://console.firebase.google.com
   - Select your project (weatherapp-b2cf7)
   - Go to Authentication → Sign-in method  
   - Enable "Email/Password"
   - Enable "Google"

### Weather Data Not Loading
1. Check location permission is granted
2. Verify you have internet connection
3. The free API has a limit (60 calls/minute)

## 📋 Next Steps

### Enable Firebase Authentication Providers
1. Go to [Firebase Console](https://console.firebase.google.com/project/weatherapp-b2cf7/authentication/providers)
2. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Save

3. Enable *Google Sign-In**:
   - Click on "Google"
   - Toggle "Enable"
   - Add support email
   - Save

### Set up Firestore
1. Go to [Firestore Database](https://console.firebase.google.com/project/weatherapp-b2cf7/firestore)
2. Click "Create database"
3. Start in **production mode**
4. Choose a location (closest to your users)
5. Update security rules (optional):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## 🎨 Customization

### Change App Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#YOUR_COLOR_HERE',
    // ... other shades
  }
}
```

### Change App Name
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "YourApp"
}
```

## 📦 Production Build

When ready to deploy:

```bash
npm run build
```

This creates an optimized `dist` folder you can deploy to:
- Vercel
- Netlify
- Firebase Hosting
- GitHub Pages

## 🆘 Need Help?

If you encounter any issues:
1. Check the browser console for errors (F12)
2. Verify Firebase settings in Console
3. Ensure all authentication providers are enabled
4. Check that API keys are valid

---

**Enjoy your weather app!** 🌤️🌧️⛈️🌈
