# Achievement System Setup Guide

## 🎯 Overview
This guide will help you implement the achievement system in your GUANT.GG platform.

## 📋 Prerequisites
- Supabase project set up
- Database access
- React app running

## 🗄️ Database Setup

### Step 1: Run the Achievement Schema
Execute the SQL in `achievement-schema.sql` in your Supabase SQL Editor:

```sql
-- This creates all the necessary tables and functions
-- Run the entire file in your Supabase SQL Editor
```

### Step 2: Verify Tables Created
Check that these tables exist in your database:
- `achievements`
- `user_achievements` 
- `user_stats`

## 🔧 Integration Steps

### Step 1: Update LobbyService
Add achievement tracking to your lobby completion logic:

```typescript
// In your lobby completion handler
import { AchievementIntegration } from '../lib/utils/achievementIntegration'

// When a match is completed
await AchievementIntegration.trackMatchCompletion(
  userId,
  matchResult, // 'win' or 'loss'
  game, // 'Valorant', 'CS2', etc.
  earnings // amount won
)
```

### Step 2: Add Achievement Tracking to Lobby Creation
```typescript
// When a user creates a lobby
await AchievementIntegration.trackLobbyCreation(userId, game)
```

### Step 3: Add Achievement Tracking to Lobby Joining
```typescript
// When a user joins a lobby
await AchievementIntegration.trackLobbyJoin(userId, game)
```

## 🎨 UI Integration

### Step 1: Add Achievement Link to Header
Update your Header component to include an achievements link:

```typescript
// In Header.tsx, add to navigation
<Link to="/achievements" className="text-white hover:text-gray-300 transition-colors">
  Achievements
</Link>
```

### Step 2: Add Achievement Badge to Profile
Show achievement count in the user profile area.

## 🚀 Testing the System

### Step 1: Create Test User
1. Sign up a new user
2. Check that user_stats record is created

### Step 2: Trigger Achievements
1. Create a lobby (should trigger "First Steps")
2. Join a lobby (should trigger "Getting Started")
3. Complete a match (should trigger "First Victory")

### Step 3: Verify Notifications
1. Check that achievement notifications appear
2. Verify achievement dashboard shows progress
3. Test achievement unlocking

## 🎯 Achievement Categories

### Match-Based Achievements
- **First Steps**: Play 1 match
- **Getting Started**: Play 5 matches
- **Dedicated Player**: Play 25 matches
- **Veteran**: Play 100 matches
- **Legend**: Play 500 matches

### Win-Based Achievements
- **First Victory**: Win 1 match
- **Rising Star**: Win 10 matches
- **Champion**: Win 50 matches
- **Dominator**: Win 200 matches
- **Unstoppable**: Win 1000 matches

### Streak Achievements
- **Hot Streak**: Win 5 matches in a row
- **On Fire**: Win 10 matches in a row
- **Unbeatable**: Win 20 matches in a row

### Earnings Achievements
- **First Earnings**: Earn $10
- **Big Spender**: Earn $100
- **High Roller**: Earn $1000
- **Millionaire**: Earn $10000

### Game-Specific Achievements
- **Valorant Rookie**: Play 10 Valorant matches
- **CS2 Warrior**: Play 10 CS2 matches
- **Valorant Master**: Win 50 Valorant matches
- **CS2 Legend**: Win 50 CS2 matches

### Special Achievements
- **Early Bird**: Join in the first month
- **Lucky Streak**: Win 3 matches in a row on first day
- **Comeback King**: Win after being down 0-2

## 🔧 Customization

### Adding New Achievements
1. Insert into `achievements` table
2. Update the requirements JSON
3. Test the achievement logic

### Modifying Achievement Logic
1. Update the `check_achievements` function
2. Modify the `update_user_stats` function
3. Test with different scenarios

### Custom Achievement Types
1. Add new category to the enum
2. Update the achievement service
3. Add UI for the new category

## 🐛 Troubleshooting

### Common Issues

1. **Achievements not unlocking**
   - Check user_stats table has data
   - Verify achievement requirements
   - Check database functions are working

2. **Notifications not showing**
   - Verify real-time subscriptions
   - Check AchievementTracker is in App.tsx
   - Test notification component

3. **Performance issues**
   - Add database indexes
   - Optimize achievement queries
   - Cache achievement data

### Debug Commands

```sql
-- Check user stats
SELECT * FROM user_stats WHERE user_id = 'your-user-id';

-- Check user achievements
SELECT * FROM user_achievements WHERE user_id = 'your-user-id';

-- Check all achievements
SELECT * FROM achievements;

-- Test achievement function
SELECT * FROM check_achievements('your-user-id');
```

## 📈 Analytics

### Achievement Statistics
- Track achievement unlock rates
- Monitor user engagement
- Analyze popular achievements

### Performance Metrics
- Achievement query performance
- Notification delivery rates
- User retention correlation

## 🎉 Success Metrics

After implementation, you should see:
- Increased user engagement
- Higher match completion rates
- More frequent platform usage
- Better user retention

## 🔄 Maintenance

### Regular Tasks
1. Monitor achievement unlock rates
2. Update achievement requirements based on user feedback
3. Add seasonal achievements
4. Clean up old achievement data

### Scaling Considerations
1. Add database indexes for performance
2. Implement achievement caching
3. Consider achievement leaderboards
4. Add achievement sharing features

## 📚 Additional Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [React Hooks Best Practices](https://reactjs.org/docs/hooks-intro.html)
- [Database Performance Optimization](https://supabase.com/docs/guides/database/performance)
