# Contact Manager Mobile App

A beautiful React Native mobile app built with Expo, HeroUI Native v3, and Uniwind for managing contacts with chat and calling features.

## Features

- 🔐 **Authentication** - Login and Register
- 👥 **Contact Management** - Add, edit, delete contacts with priorities and categories
- 💬 **Chat Interface** - Real-time messaging with contacts
- 📞 **Voice & Video Calls** - Beautiful call interface with controls
- 📊 **Dashboard** - View contact stats and insights
- 🎨 **Beautiful UI** - Built with HeroUI Native v3 components

## Tech Stack

- **React Native** with Expo
- **HeroUI Native v3** - Beautiful component library
- **Uniwind** - Tailwind CSS for React Native
- **TypeScript** - Type safety
- **Expo Router** - File-based routing
- **AsyncStorage** - Local data persistence
- **Axios** - API communication

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo Go app on your mobile device
- Backend server running (see server folder)

### Installation

1. **Install dependencies:**
   ```bash
   cd cilent
   npm install
   ```

2. **Update API URL:**
   - Open `types/index.ts`
   - Replace the IP address with your computer's IP:
     ```bash
     # Find your IP (Windows):
     ipconfig
     # Look for IPv4 Address
     ```
   - Update `API_URL` constant

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Connect from your phone:**
   - Make sure phone and computer are on same WiFi
   - Scan QR code with Expo Go app
   - Or manually enter: `exp://YOUR_IP:8081`

### Windows Firewall Setup

If the app doesn't connect, add firewall rules:

```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Expo" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

## Project Structure

```
cilent/
├── app/                    # Screens (file-based routing)
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Contacts list
│   │   ├── chats.tsx      # Chat list
│   │   └── profile.tsx    # User profile
│   ├── login.tsx          # Login screen
│   ├── register.tsx       # Register screen
│   ├── chat/[id].tsx      # Chat conversation
│   ├── call/[id].tsx      # Voice/Video call
│   └── contact/[id].tsx   # Contact details/edit
├── context/               # React Context (State Management)
│   ├── AuthContext.tsx    # Authentication state
│   └── ContactContext.tsx # Contacts state
├── types/                 # TypeScript definitions
│   └── index.ts
├── global.css            # Tailwind styles
└── metro.config.js       # Metro bundler config

## API Integration

The app connects to the Node.js backend server. Make sure the server is running:

```bash
cd server
npm install
npm start
```

Server should be running on `http://localhost:5000`

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser (not recommended for this app)

## Features Overview

### Contact Management
- Add contacts with name, phone, priority, category
- Edit and update contact details
- Delete contacts
- Search and filter contacts
- Track relationship scores

### Chat
- Real-time messaging interface
- Message history
- Online status indicators
- Quick access to voice/video calls

### Calling
- Voice call interface
- Video call interface
- Call controls (mute, speaker, video toggle)
- Beautiful gradient UI

### Profile
- View user info
- Contact statistics
- Quick actions
- Settings menu
- Logout

## Customization

### Colors
Modify `global.css` for theme colors using Tailwind CSS variables.

### Components
HeroUI Native components are used throughout:
- Button, Input, Card, Chip
- Customizable via Tailwind classes

## Troubleshooting

### App won't open on phone
1. Check firewall settings
2. Verify same WiFi network
3. Use manual IP entry in Expo Go
4. Restart Expo server with `npm start --clear`

### API errors
1. Check server is running
2. Verify API_URL in `types/index.ts`
3. Check network connectivity

### Build errors
1. Clear cache: `npm start --clear`
2. Delete `node_modules` and reinstall
3. Check TypeScript errors

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
