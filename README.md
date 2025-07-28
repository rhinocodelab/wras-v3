# 🚂 WRAS V2 - Railway Announcement System for Deaf and Hard of Hearing

A comprehensive Next.js application designed to generate multilingual railway announcements with Indian Sign Language (ISL) support, specifically tailored for accessibility and inclusivity in railway communication.

## 🌟 Features

### 🎯 Core Functionality
- **Multilingual Announcements**: Support for English, Hindi, Marathi, and Gujarati
- **Indian Sign Language (ISL) Integration**: Automatic ISL video playlist generation
- **Text-to-Speech (TTS)**: High-quality audio generation using Google Cloud TTS
- **Speech-to-Text**: Audio transcription capabilities
- **Real-time Translation**: AI-powered translation between supported languages

### 🛤️ Railway Management
- **Train Route Management**: Complete CRUD operations for train routes
- **Announcement Templates**: Predefined templates for different announcement categories
- **Dynamic Content Generation**: Automatic placeholder replacement with route-specific data
- **Audio Asset Management**: Organized storage and retrieval of audio files

### 🎨 User Interface
- **Modern Dashboard**: Clean, responsive interface with real-time updates
- **Mobile-First Design**: Optimized for all device sizes
- **Accessibility Features**: WCAG compliant design with proper contrast and navigation
- **Interactive Components**: Rich UI with drag-and-drop, modals, and tooltips

### 🤖 AI-Powered Features
- **Google Cloud Integration**: Leverages Google's AI services for translation and TTS
- **Genkit AI Framework**: Structured AI workflows for complex operations
- **Automatic Content Generation**: Smart template processing and audio concatenation
- **Intelligent ISL Mapping**: Automatic matching of text to ISL video content

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Radix UI + Tailwind CSS
- **Database**: SQLite with server-side operations
- **AI Services**: Google Cloud (Translation, TTS, Speech-to-Text)
- **AI Framework**: Genkit for structured AI workflows
- **Authentication**: Session-based with secure cookies

### Project Structure
```
wras-v2/
├── src/
│   ├── ai/                    # AI workflows and services
│   │   ├── flows/            # Genkit AI flows
│   │   │   ├── announcement-flow.ts
│   │   │   ├── translate-flow.ts
│   │   │   ├── tts-flow.ts
│   │   │   └── speech-to-text-flow.ts
│   │   └── genkit.ts         # AI configuration
│   ├── app/                  # Next.js app router
│   │   ├── ai-database/      # AI asset management
│   │   ├── announcement-templates/
│   │   ├── isl-dataset/      # ISL video management
│   │   ├── train-route-management/
│   │   ├── speech-to-isl/    # Speech conversion
│   │   ├── text-to-isl/      # Text conversion
│   │   ├── audio-file-to-isl/ # Audio file processing
│   │   └── actions.ts        # Server actions
│   ├── components/           # Reusable UI components
│   └── hooks/               # Custom React hooks
├── public/
│   ├── audio/               # Generated audio files
│   └── isl_dataset/         # ISL video files
└── database.db              # SQLite database
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud account with enabled services:
  - Cloud Translation API
  - Text-to-Speech API
  - Speech-to-Text API

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rhinocodelab/wras-v2.git
   cd wras-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Cloud credentials**
   - Create a service account in Google Cloud Console
   - Download the JSON credentials file
   - Set the environment variable:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/credentials.json"
     ```

4. **Start the application**
   ```bash
   # Use the provided startup script (recommended)
   ./start.sh
   
   # Or use npm directly
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:9002](http://localhost:9002)
   - Default login: Use any username/password (demo mode)

## 📖 Usage Guide

### 1. Dashboard Overview
The main dashboard provides a comprehensive view of:
- Recent announcements
- Quick access to all features
- Real-time system status

### 2. Train Route Management
- **Add Routes**: Import train data via CSV or manual entry
- **Edit Routes**: Modify existing route information
- **Delete Routes**: Remove outdated routes
- **Bulk Operations**: Process multiple routes simultaneously

### 3. AI Database Management
- **Translations**: Generate multilingual translations for route data
- **Audio Generation**: Create TTS audio files for all languages
- **Template Audio**: Generate audio for announcement templates

### 4. Announcement Templates
- **Template Categories**: Arriving, Delay, Cancelled, Platform Change
- **Multilingual Support**: Templates for all supported languages
- **Audio Generation**: Automatic TTS for template components

### 5. ISL Dataset Management
- **Video Upload**: Add ISL videos for words and phrases
- **Video Organization**: Categorized storage system
- **Playlist Generation**: Automatic ISL video matching

### 6. Conversion Tools
- **Speech to ISL**: Convert spoken audio to ISL videos
- **Text to ISL**: Convert text input to ISL videos
- **Audio File to ISL**: Process audio files for ISL conversion

## 🔧 Configuration

### Environment Variables
```bash
# Google Cloud credentials
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Application settings
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### Database Schema
The application uses SQLite with the following main tables:
- `train_routes`: Train route information
- `train_route_translations`: Multilingual translations
- `train_route_audio`: Audio file paths
- `announcement_templates`: Template definitions

## 🎨 Customization

### Styling
- **Theme**: Customizable via Tailwind CSS
- **Colors**: Railway-themed color palette
- **Components**: Extensible Radix UI components

### Languages
To add new languages:
1. Update language maps in translation flows
2. Add TTS voice configurations
3. Create corresponding ISL video datasets

### Announcement Categories
New announcement types can be added by:
1. Adding category to `ANNOUNCEMENT_CATEGORIES`
2. Creating template files
3. Updating UI components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Ensure accessibility compliance
- Add comprehensive error handling
- Include unit tests for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud**: For AI services and infrastructure
- **Genkit**: For AI workflow management
- **Radix UI**: For accessible component primitives
- **Tailwind CSS**: For utility-first styling
- **Indian Railways**: For inspiration and use cases

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Version History

- **v0.1.0**: Initial release with core functionality
- **v0.2.0**: Added ISL integration and enhanced UI
- **v0.3.0**: Improved AI workflows and performance
- **v0.4.0**: Added speech-to-text and audio processing

---

**Built with ❤️ for inclusive railway communication**
