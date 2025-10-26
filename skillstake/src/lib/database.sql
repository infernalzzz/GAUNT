-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE
);

-- Create games table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regions table
CREATE TABLE regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create lobbies table
CREATE TABLE lobbies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  region VARCHAR(50) NOT NULL,
  pot DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  bond_per_player DECIMAL(10,2) NOT NULL,
  winner_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  max_players INTEGER DEFAULT 2,
  current_players INTEGER DEFAULT 0
);

-- Create lobby_participants table
CREATE TABLE lobby_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'disqualified')),
  UNIQUE(lobby_id, user_id)
);

-- Insert sample games
INSERT INTO games (name, icon) VALUES
('Valorant', '🎮'),
('CS2', '🎮'),
('Dota 2', '🎮'),
('League of Legends', '🎮'),
('Overwatch', '🎮');

-- Insert sample regions
INSERT INTO regions (name, code) VALUES
('Southeast Asia', 'SEA'),
('North America', 'NA'),
('Europe', 'EU'),
('Asia', 'ASIA');

-- Insert sample lobbies
INSERT INTO lobbies (game, price, region, pot, platform_fee, bond_per_player, winner_amount, status, max_players, current_players) VALUES
('Valorant', 5.00, 'SEA', 10.00, 1.00, 0.25, 9.00, 'in_progress', 2, 2),
('Valorant', 20.00, 'SEA', 40.00, 4.00, 1.00, 36.00, 'in_progress', 2, 2),
('CS2', 25.00, 'SEA', 50.00, 5.00, 1.25, 45.00, 'in_progress', 2, 2),
('Valorant', 5.00, 'SEA', 10.00, 1.00, 0.25, 9.00, 'in_progress', 2, 2);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view lobbies" ON lobbies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create lobbies" ON lobbies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own lobby participants" ON lobby_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join lobbies" ON lobby_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
