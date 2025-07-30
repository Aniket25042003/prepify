<!-- Created with CodDoc - AI-powered README generator -->

# Prepwiser

## Description

Prepwiser is a web application designed to facilitate interview preparation and practice. It leverages real-time communication capabilities, AI-powered analysis, and interactive UI components to provide a comprehensive platform for users to enhance their interview skills. The application appears to integrate features like user authentication, real-time video/audio communication, interview recording, AI-driven analysis, and interactive UI elements.

## Features

*   **User Authentication and Authorization:** Secure user management using Supabase.
*   **Real-time Communication:** Enables video and audio communication using LiveKit.
*   **Interview Recording and Playback:** Allows users to record and review their practice interviews.
*   **AI-Powered Interview Analysis:** Analyzes interviews (likely using LLMs) to provide feedback.
*   **Interactive UI Components:** Utilizes Tailwind CSS and React components for a dynamic user interface.
*   **Routing and Navigation:** Manages application flow using React Router DOM.
*   **Animated UI Elements:** Enhances user experience with Framer Motion animations.
*   **3D UI Elements:** Integrates 3D graphics using Three.js and @react-three/fiber for enhanced visuals.

## Installation

To run Prepwiser locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Aniket25042003/prepwiser.git
    cd prepwiser
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Supabase:** Configure your Supabase project and environment variables for authentication and data storage.

## Usage

1.  **Development:**

    ```bash
    npm run dev
    ```
    This will start the development server, typically on `http://localhost:5173`. Open your web browser to access the application.

2.  **Build for Production:**

    ```bash
    npm run build
    ```
    This command creates an optimized production build of the application in the `dist` directory.

3.  **Preview the Build:**

    ```bash
    npm run preview
    ```
    This command starts a local server to preview your built application.

**Example Usage Scenarios:**

*   **Landing Page:** Navigate to the `/` route (or the landing page specified in `src/pages/LandingPage.tsx`) to learn more about the application.
*   **Dashboard:** After logging in, access the dashboard via the `/dashboard` route (as defined in `src/pages/Dashboard.tsx`) to begin preparing for interviews.
*   **Chat/Interview Room:** Participate in a live interview session via the `/chat` route (as defined in `src/pages/ChatPage.tsx`), leveraging LiveKit for real-time communication.
*   **Authentication:** Use the `AuthModal` component (inferred from `src/components/AuthModal.tsx`) to register and login.
*   **Token Generation:** The Supabase Functions (`supabase/functions/livekit-token/index.ts`) are used to generate LiveKit access tokens.

## Tech Stack and Dependencies

*   **Languages:** TypeScript, JavaScript, HTML, CSS
*   **Frameworks:** React, Vite, Tailwind CSS, Supabase, LiveKit, React Router DOM, Framer Motion, Three.js, @react-three/fiber
*   **Dependencies:**
    *   `lucide-react`: For icons.
    *   `react` and `react-dom`: Core React libraries.
    *   `react-router-dom`: For routing and navigation.
    *   `@supabase/supabase-js`: For interacting with Supabase.
    *   `@livekit/components-react`, `@livekit/components-core`, `livekit-client`, `livekit-server-sdk`: For real-time communication features.
    *   `clsx`, `tailwind-merge`: For utility class management.
    *   `framer-motion`: For UI animations.
    *   `three`, `@react-three/fiber`: For 3D graphics.
    *   ESLint, TypeScript, and related tooling for code quality and type checking.

## Project Structure Overview

```
.
├── supabase/                      # Supabase related files
│   ├── functions/                 # Supabase Functions
│   │   ├── livekit-token/         # LiveKit token generation function
│   │   │   └── index.ts
│   │   ├── livekit-agent/         # LiveKit agent function
│   │   │   └── index.ts
│   │   └── analyze-interview/     # Interview analysis function
│   │       └── index.ts
├── src/                           # Source code directory
│   ├── components/                # React components
│   │   ├── ui/                    # UI components
│   │   ├── AvatarDisplay.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── AuthModal.tsx
│   ├── lib/                       # Utility libraries and modules
│   │   ├── utils.ts
│   │   ├── supabase.ts
│   │   ├── tavus.ts
│   │   ├── llmAnalysis.ts
│   │   └── livekit.ts
│   ├── hooks/                     # Custom React hooks
│   │   └── useConversation.ts
│   ├── context/                   # React context providers
│   │   └── AuthContext.tsx
│   ├── public/                    # Public assets
│   │   └── hero_image.png
│   ├── pages/                     # React pages/routes
│   │   ├── ChatPage.tsx
│   │   ├── Dashboard.tsx
│   │   └── LandingPage.tsx
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Main application component
│   ├── index.css                  # Global styles
│   └── vite-env.d.ts
├── .bolt/                         # Bolt AI configuration
│   ├── prompt/
│   └── config.json
├── vite.config.ts
├── postcss.config.js
├── tailwind.config.js
├── eslint.config.js
├── tsconfig.json
├── package.json
├── index.html
├── tsconfig.node.json
├── package-lock.json
```

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them.
4.  Submit a pull request.

## License

The project is licensed under the [MIT License](LICENSE).