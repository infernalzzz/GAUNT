-- Achievement System Database Schema
-- Run this in your Supabase SQL Editor

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL, -- emoji or icon identifier
  category VARCHAR(50) NOT NULL, -- 'matches', 'wins', 'streaks', 'social', 'special'
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points INTEGER DEFAULT 10, -- points awarded for unlocking
  requirements JSONB NOT NULL, -- flexible requirements structure
  is_hidden BOOLEAN DEFAULT FALSE, -- hidden achievements (like secret ones)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table (junction table)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress JSONB, -- for tracking progress on multi-step achievements
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table for tracking achievement progress
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  matches_by_game JSONB DEFAULT '{}', -- {"Valorant": 5, "CS2": 3}
  wins_by_game JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(user_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_name VARCHAR) AS $$
DECLARE
  user_stats_record RECORD;
  achievement_record RECORD;
  requirements_met BOOLEAN;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats_record FROM user_stats WHERE user_stats.user_id = check_achievements.user_id;
  
  -- If no stats record, create one
  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id) VALUES (check_achievements.user_id);
    SELECT * INTO user_stats_record FROM user_stats WHERE user_stats.user_id = check_achievements.user_id;
  END IF;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT * FROM achievements 
    WHERE id NOT IN (
      SELECT achievement_id FROM user_achievements 
      WHERE user_achievements.user_id = check_achievements.user_id
    )
  LOOP
    requirements_met := TRUE;
    
    -- Check different requirement types
    CASE achievement_record.category
      WHEN 'matches' THEN
        requirements_met := (user_stats_record.total_matches >= (achievement_record.requirements->>'min_matches')::INTEGER);
      WHEN 'wins' THEN
        requirements_met := (user_stats_record.total_wins >= (achievement_record.requirements->>'min_wins')::INTEGER);
      WHEN 'streaks' THEN
        requirements_met := (user_stats_record.longest_win_streak >= (achievement_record.requirements->>'min_streak')::INTEGER);
      WHEN 'earnings' THEN
        requirements_met := (user_stats_record.total_earnings >= (achievement_record.requirements->>'min_earnings')::DECIMAL);
      WHEN 'game_specific' THEN
        requirements_met := (
          (user_stats_record.matches_by_game->>(achievement_record.requirements->>'game'))::INTEGER >= 
          (achievement_record.requirements->>'min_matches')::INTEGER
        );
    END CASE;
    
    -- If requirements met, unlock achievement
    IF requirements_met THEN
      INSERT INTO user_achievements (user_id, achievement_id) 
      VALUES (check_achievements.user_id, achievement_record.id);
      
      achievement_id := achievement_record.id;
      achievement_name := achievement_record.name;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_match_result VARCHAR, -- 'win' or 'loss'
  p_game VARCHAR,
  p_earnings DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  current_streak INTEGER;
BEGIN
  -- Insert or update user stats
  INSERT INTO user_stats (user_id, total_matches, total_wins, total_losses, current_win_streak, longest_win_streak, total_earnings, matches_by_game, wins_by_game)
  VALUES (
    p_user_id, 
    1, 
    CASE WHEN p_match_result = 'win' THEN 1 ELSE 0 END,
    CASE WHEN p_match_result = 'loss' THEN 1 ELSE 0 END,
    CASE WHEN p_match_result = 'win' THEN 1 ELSE 0 END,
    CASE WHEN p_match_result = 'win' THEN 1 ELSE 0 END,
    p_earnings,
    jsonb_build_object(p_game, 1),
    CASE WHEN p_match_result = 'win' THEN jsonb_build_object(p_game, 1) ELSE jsonb_build_object(p_game, 0) END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_matches = user_stats.total_matches + 1,
    total_wins = user_stats.total_wins + CASE WHEN p_match_result = 'win' THEN 1 ELSE 0 END,
    total_losses = user_stats.total_losses + CASE WHEN p_match_result = 'loss' THEN 1 ELSE 0 END,
    current_win_streak = CASE 
      WHEN p_match_result = 'win' THEN user_stats.current_win_streak + 1 
      ELSE 0 
    END,
    longest_win_streak = GREATEST(
      user_stats.longest_win_streak,
      CASE WHEN p_match_result = 'win' THEN user_stats.current_win_streak + 1 ELSE 0 END
    ),
    total_earnings = user_stats.total_earnings + p_earnings,
    matches_by_game = COALESCE(user_stats.matches_by_game, '{}'::jsonb) || 
      jsonb_build_object(p_game, COALESCE((user_stats.matches_by_game->>p_game)::INTEGER, 0) + 1),
    wins_by_game = COALESCE(user_stats.wins_by_game, '{}'::jsonb) || 
      jsonb_build_object(p_game, COALESCE((user_stats.wins_by_game->>p_game)::INTEGER, 0) + CASE WHEN p_match_result = 'win' THEN 1 ELSE 0 END),
    updated_at = NOW();
  
  -- Check for new achievements
  PERFORM check_achievements(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, rarity, points, requirements) VALUES
-- Match-based achievements
('First Steps', 'Play your first match', '🎮', 'matches', 'common', 10, '{"min_matches": 1}'),
('Getting Started', 'Play 5 matches', '🏃', 'matches', 'common', 25, '{"min_matches": 5}'),
('Dedicated Player', 'Play 25 matches', '💪', 'matches', 'rare', 50, '{"min_matches": 25}'),
('Veteran', 'Play 100 matches', '🏆', 'matches', 'epic', 100, '{"min_matches": 100}'),
('Legend', 'Play 500 matches', '👑', 'matches', 'legendary', 250, '{"min_matches": 500}'),

-- Win-based achievements
('First Victory', 'Win your first match', '🎉', 'wins', 'common', 15, '{"min_wins": 1}'),
('Rising Star', 'Win 10 matches', '⭐', 'wins', 'common', 30, '{"min_wins": 10}'),
('Champion', 'Win 50 matches', '🥇', 'wins', 'rare', 75, '{"min_wins": 50}'),
('Dominator', 'Win 200 matches', '🔥', 'wins', 'epic', 150, '{"min_wins": 200}'),
('Unstoppable', 'Win 1000 matches', '💀', 'wins', 'legendary', 500, '{"min_wins": 1000}'),

-- Streak achievements
('Hot Streak', 'Win 5 matches in a row', '🔥', 'streaks', 'rare', 40, '{"min_streak": 5}'),
('On Fire', 'Win 10 matches in a row', '🚀', 'streaks', 'epic', 75, '{"min_streak": 10}'),
('Unbeatable', 'Win 20 matches in a row', '⚡', 'streaks', 'legendary', 150, '{"min_streak": 20}'),

-- Earnings achievements
('First Earnings', 'Earn your first $10', '💰', 'earnings', 'common', 20, '{"min_earnings": 10}'),
('Big Spender', 'Earn $100', '💎', 'earnings', 'rare', 50, '{"min_earnings": 100}'),
('High Roller', 'Earn $1000', '💸', 'earnings', 'epic', 100, '{"min_earnings": 1000}'),
('Millionaire', 'Earn $10000', '🏦', 'earnings', 'legendary', 300, '{"min_earnings": 10000}'),

-- Game-specific achievements
('Valorant Rookie', 'Play 10 Valorant matches', '🎯', 'game_specific', 'common', 25, '{"game": "Valorant", "min_matches": 10}'),
('CS2 Warrior', 'Play 10 CS2 matches', '🔫', 'game_specific', 'common', 25, '{"game": "CS2", "min_matches": 10}'),
('Valorant Master', 'Win 50 Valorant matches', '🎯', 'game_specific', 'epic', 100, '{"game": "Valorant", "min_wins": 50}'),
('CS2 Legend', 'Win 50 CS2 matches', '🔫', 'game_specific', 'epic', 100, '{"game": "CS2", "min_wins": 50}'),

-- Special achievements
('Early Bird', 'Join in the first month', '🐦', 'special', 'rare', 50, '{"early_adopter": true}'),
('Lucky Streak', 'Win 3 matches in a row on your first day', '🍀', 'special', 'epic', 75, '{"first_day_streak": 3}'),
('Comeback King', 'Win a match after being down 0-2', '👑', 'special', 'rare', 60, '{"comeback": true}');
