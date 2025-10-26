# SkillStake - Competitive Gaming Platform

A modern web application for competitive gaming where players can challenge each other and earn rewards for their skills.

## Features

- **Dark Theme UI**: Modern, gaming-focused design
- **Lobby System**: Create and join gaming lobbies
- **Real-time Updates**: Live lobby status and participant updates
- **Multi-game Support**: Valorant, CS2, Dota 2, League of Legends, Overwatch
- **Regional Filtering**: Support for different gaming regions
- **User Authentication**: Secure user registration and login

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn-ui patterns
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd skillstake
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure your Supabase project:
   - Create a new Supabase project
   - Copy your project URL and anon key to `.env.local`
   - Run the SQL schema from `src/lib/database.sql` in your Supabase SQL editor

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The application uses the following main tables:

- **users**: User accounts and profiles
- **lobbies**: Gaming lobbies with pricing and status
- **lobby_participants**: User participation in lobbies
- **games**: Supported games
- **regions**: Gaming regions

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation header
│   ├── Hero.tsx        # Hero section
│   └── FeaturedLobbies.tsx # Lobby listings
├── lib/                # Utilities and services
│   ├── supabase.ts     # Supabase client
│   ├── database.sql    # Database schema
│   └── services/       # API services
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.