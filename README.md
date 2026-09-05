# 🕌 Animated Muslim Wedding Invitation

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Website-brightgreen?style=for-the-badge&logo=vercel)](https://animated-muslim-wedding-invitation.vercel.app/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An animated, culturally rich Muslim wedding invitation website featuring traditional Islamic aesthetics, interactive 3D elements, dynamic animations, an interactive RSVP form, and Web Audio ambient music.

🔗 **Live Website**: [https://animated-muslim-wedding-invitation.vercel.app/](https://animated-muslim-wedding-invitation.vercel.app/)

---

## ✨ Features

- **🎵 Web Audio Ambient Music**: Built-in procedural ambient oriental music synthesized using the Web Audio API with animated audio visualizer waves and play/pause controls.
- **✨ 3D Tilt Card Effects**: Interactive perspective tilt with dynamic specular light reflection following mouse movements.
- **💫 Interactive Particle Effects**: Custom particle bursts on mouse clicks and taps.
- **📜 Sacred Verses & Calligraphy**:
  - *Bismillah ar-Rahman ar-Rahim* (بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ)
  - Surah Ar-Rum 30:21 with English translation
  - Traditional wedding du'a: *Barakallahu lakuma wa baraka 'alaykuma wa jama'a baynakuma fi khayr*
- **🏮 Islamic Elements & Animations**:
  - Swaying Ramadan/wedding lanterns
  - Twinkling stars & floating flower petals and crescents
  - Sacred geometry rotating rings and liquid gradient blobs
  - Wave section dividers with emerald and gold color palette
- **⏳ Real-Time Countdown Timer**: Live ticking countdown to the blessed wedding day.
- **📅 Events & Timeline**:
  - 🌿 Mehndi Night
  - 🕌 Nikah Ceremony
  - 🌟 Walima Reception
  - ☀️ Family Farewell Brunch
- **📍 Venue & Location Details**: Direct map links and event addresses for venues (Sultan Ahmed Mosque & Al-Noor Palace, Istanbul).
- **📖 Islamic Traditions Guide**: Cultural and religious context for the Nikah, Mahr, Walima feast, and modesty traditions.
- **👗 Dress Code Guide**: Visual color palette recommendations (Emerald, Gold, Ivory).
- **💌 Interactive RSVP Form**: Name, email, guest counter, attendance confirmation, and heartfelt du'a message submission with success feedback.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS animations
- **Typography**: Google Fonts (*Cinzel Decorative*, *Amiri*, *Cormorant*)
- **Hosting**: [Vercel](https://vercel.com/)

---

## 📂 Project Structure

```
├── src/
│   ├── App.tsx          # Main wedding invitation UI, components & animations
│   ├── index.css        # Typography, keyframes, scroll bar & color variables
│   ├── main.tsx         # Application entry point
│   └── vite-env.d.ts    # Vite environment type definitions
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build & plugin configuration
└── README.md            # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/animated-muslim-wedding-invitation.git
cd animated-muslim-wedding-invitation
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
The optimized production files will be output to the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

---

## 🌐 Deployment to Vercel

You can deploy this project directly to Vercel with zero configuration:

1. Push your code to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard).
3. Click **"New Project"** and import your GitHub repository.
4. Framework Preset will automatically be detected as **Vite**.
5. Click **"Deploy"**.

Your website will be live at `https://your-project-name.vercel.app/`!

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
