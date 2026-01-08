# 🔍 Fact Checking Website

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/ronaks-projects-c39a60e7/v0-fact-checking-website)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/vqmmEtThDQv)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

A modern, AI-powered fact-checking web application built with Next.js 16, TypeScript, and Google's Generative AI. This application helps users verify information and check facts in real-time using advanced machine learning models.

## ✨ Features

- 🤖 **AI-Powered Fact Checking**: Leverages Google's Generative AI for accurate fact verification
- ⚡ **Real-time Analysis**: Instant fact-checking results with detailed explanations
- 🎨 **Modern UI**: Built with Radix UI components and Tailwind CSS for a sleek, responsive design
- 🌙 **Dark Mode Support**: Automatic theme switching with next-themes
- 📊 **Data Visualization**: Interactive charts and graphs using Recharts
- 🔐 **Type-Safe**: Fully typed with TypeScript and validated with Zod schemas
- 📱 **Responsive Design**: Mobile-first approach for all device sizes

## 🚀 Live Demo

**Production**: [https://vercel.com/ronaks-projects-c39a60e7/v0-fact-checking-website](https://vercel.com/ronaks-projects-c39a60e7/v0-fact-checking-website)

**Continue Building**: [https://v0.app/chat/vqmmEtThDQv](https://v0.app/chat/vqmmEtThDQv)

## 🛠️ Tech Stack

### Core
- **Framework**: [Next.js 16.1](https://nextjs.org/) - React framework for production
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Runtime**: [React 19.2](https://react.dev/) - UI library

### Styling
- **CSS Framework**: [Tailwind CSS 4.1](https://tailwindcss.com/) - Utility-first CSS
- **Components**: [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- **Animations**: tailwindcss-animate, tw-animate-css
- **Class Management**: clsx, tailwind-merge, class-variance-authority

### AI & Data
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) - Google's Generative AI SDK
- **Charts**: [Recharts](https://recharts.org/) - Composable charting library
- **Date Handling**: [date-fns](https://date-fns.org/) - Modern date utility library

### Forms & Validation
- **Form Management**: [React Hook Form](https://react-hook-form.com/) - Performant forms
- **Validation**: [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Resolvers**: @hookform/resolvers - Form validation resolvers

### UI Components
- Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
- Hover Card, Navigation Menu, Popover, Progress, Radio Group
- Scroll Area, Select, Slider, Switch, Tabs, Toast, Tooltip
- Carousel (embla-carousel-react), Command Palette (cmdk)
- OTP Input (input-otp), Drawer (vaul)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ronak501/fact-checking-website.git
   cd fact-checking-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build the application for production
npm run start    # Start production server
npm run lint     # Run ESLint to check code quality
```

## 📁 Project Structure

```
fact-checking-website/
├── app/                  # Next.js 16 App Router pages
├── components/           # Reusable React components
│   └── ui/              # Radix UI component wrappers
├── lib/                 # Utility functions and helpers
├── public/              # Static assets
├── styles/              # Global styles and Tailwind config
├── components.json      # Shadcn UI configuration
├── next.config.mjs      # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## 🔄 How It Works

1. **Create & Modify**: Build your project using [v0.app](https://v0.app)
2. **Deploy**: Deploy your chats from the v0 interface
3. **Auto-Sync**: Changes are automatically pushed to this repository
4. **Live Updates**: Vercel deploys the latest version automatically

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and maintained by Ronak501.

## 🙏 Acknowledgments

- Built with [v0.app](https://v0.app) - AI-powered UI generation
- Deployed on [Vercel](https://vercel.com) - The platform for frontend developers
- Powered by [Google's Generative AI](https://ai.google.dev) - Advanced AI capabilities
- UI Components from [Radix UI](https://www.radix-ui.com/) - Accessible primitives

## 📧 Contact

For questions or support, please open an issue in this repository.

---

**Note**: This repository automatically syncs with your [v0.app](https://v0.app) deployments. Any changes made through v0.app will be reflected here.