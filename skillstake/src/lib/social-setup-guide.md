# Social Features Setup Guide

## 🎯 Overview
This guide will help you implement the social features system for your GUANT.GG platform, including friend systems, private lobbies, and real-time chat.

## 📋 Prerequisites
- Supabase project set up
- Achievement system implemented (optional but recommended)
- React app running

## 🗄️ Database Setup

### Step 1: Run the Social Schema
Execute the SQL in `social-schema.sql` in your Supabase SQL Editor:

```sql
-- This creates all the necessary tables and functions for social features
-- Run the entire file in your Supabase SQL Editor
```

### Step 2: Verify Tables Created
Check that these tables exist in your database:
- `friends`
- `friend_groups`
- `friend_group_members`
- `private_lobbies`
- `lobby_invites`
- `chat_rooms`
- `chat_messages`
- `user_presence`
- `social_notifications`

## 🔧 Integration Steps

### Step 1: Update App.tsx
Add the social dashboard route:

```typescript
// In App.tsx, add the import
import SocialDashboard from './components/SocialDashboard'

// Add the route
<Route path="/social" element={<SocialDashboard />} />
```

### Step 2: Update Header Navigation
Add social link to your header:

```typescript
// In Header.tsx, add to navigation
<Link to="/social" className="text-white hover:text-gray-300 transition-colors">
  Social
</Link>
```

### Step 3: Integrate Chat with Lobbies
Update your lobby components to include chat:

```typescript
// In your lobby detail component
import LobbyChat from './LobbyChat'

// Add chat to lobby view
<LobbyChat lobbyId={lobby.id} />
```

### Step 4: Add Private Lobby Creation
Update your lobby creation to support private lobbies:

```typescript
// In your create lobby component
import PrivateLobbyModal from './PrivateLobbyModal'

// Add private lobby option
const [isPrivate, setIsPrivate] = useState(false)
const [showPrivateModal, setShowPrivateModal] = useState(false)

// In your lobby creation form
<label className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={isPrivate}
    onChange={(e) => setIsPrivate(e.target.checked)}
  />
  <span>Make this a private lobby</span>
</label>
```

## 🎨 UI Integration

### Step 1: Add Social Navigation
Update your main navigation to include social features:

```typescript
// Add to your main navigation
const socialLinks = [
  { name: 'Friends', href: '/social', icon: Users },
  { name: 'Chat', href: '/social?tab=chat', icon: MessageCircle },
  { name: 'Notifications', href: '/social?tab=notifications', icon: Bell }
]
```

### Step 2: Add Friend Status to User Profile
Show friend count and online status in user profiles:

```typescript
// In ProfilePage.tsx, add social stats
const [socialStats, setSocialStats] = useState(null)

useEffect(() => {
  const loadSocialStats = async () => {
    const stats = await SocialService.getSocialStats()
    setSocialStats(stats)
  }
  loadSocialStats()
}, [])
```

### Step 3: Add Chat to Lobby Cards
Show chat availability in lobby listings:

```typescript
// In FeaturedLobbies.tsx, add chat indicator
{lobby.has_chat && (
  <div className="flex items-center space-x-1 text-blue-400">
    <MessageCircle className="w-4 h-4" />
    <span className="text-sm">Chat Available</span>
  </div>
)}
```

## 🚀 Testing the System

### Step 1: Test Friend System
1. Create two test users
2. Send friend request from one to another
3. Accept the friend request
4. Verify both users see each other as friends

### Step 2: Test Private Lobbies
1. Create a private lobby
2. Generate invite code
3. Share invite code with friend
4. Verify friend can join using invite code

### Step 3: Test Chat System
1. Create a lobby with chat enabled
2. Join the lobby
3. Send messages in chat
4. Verify real-time message delivery

### Step 4: Test Notifications
1. Send friend request
2. Verify notification appears
3. Accept friend request
4. Verify notification updates

## 🎯 Social Features Overview

### Friend System
- **Send Friend Requests**: Users can search and send friend requests
- **Accept/Decline Requests**: Manage incoming friend requests
- **Friend Groups**: Organize friends into custom groups
- **Online Status**: See which friends are online
- **Friend Search**: Search for users by username or display name

### Private Lobbies
- **Private Lobby Creation**: Create lobbies that require invitation
- **Invite Codes**: Generate shareable codes for private lobbies
- **Friend Invitations**: Invite friends directly to private lobbies
- **Access Control**: Only invited users can join private lobbies

### Chat System
- **Lobby Chat**: Real-time chat for each lobby
- **Message Types**: Support for text, system, and achievement messages
- **User Presence**: Show who's currently in the chat
- **Message History**: Persistent chat history
- **Real-time Updates**: Live message delivery

### Notifications
- **Friend Requests**: Notifications for incoming friend requests
- **Lobby Invites**: Notifications for private lobby invitations
- **Achievement Unlocks**: Notifications for new achievements
- **System Messages**: General platform notifications

## 🔧 Customization

### Adding New Message Types
1. Update the `message_type` enum in the database
2. Add handling in the chat component
3. Update the message display logic

### Custom Friend Groups
1. Add color picker for group colors
2. Implement group icons
3. Add group descriptions

### Advanced Chat Features
1. **File Sharing**: Add support for image/file uploads
2. **Emoji Reactions**: Add emoji reactions to messages
3. **Message Threading**: Support for reply threads
4. **Voice Chat**: Integrate voice chat functionality

## 🐛 Troubleshooting

### Common Issues

1. **Chat messages not appearing**
   - Check real-time subscription setup
   - Verify RLS policies for chat_messages
   - Check user permissions

2. **Friend requests not working**
   - Verify friends table RLS policies
   - Check user authentication
   - Test database functions

3. **Private lobbies not accessible**
   - Check private_lobbies table permissions
   - Verify invite code generation
   - Test lobby_invites table

### Debug Commands

```sql
-- Check friend relationships
SELECT * FROM friends WHERE user_id = 'your-user-id' OR friend_id = 'your-user-id';

-- Check chat messages
SELECT * FROM chat_messages WHERE room_id = 'your-room-id';

-- Check notifications
SELECT * FROM social_notifications WHERE user_id = 'your-user-id';

-- Check user presence
SELECT * FROM user_presence WHERE user_id = 'your-user-id';
```

## 📈 Analytics

### Social Metrics
- Friend request acceptance rates
- Chat message frequency
- Private lobby usage
- User engagement metrics

### Performance Metrics
- Real-time message delivery speed
- Friend search performance
- Notification delivery rates

## 🎉 Success Metrics

After implementation, you should see:
- Increased user engagement
- Higher lobby participation rates
- More social interactions
- Better user retention
- Increased platform stickiness

## 🔄 Maintenance

### Regular Tasks
1. Monitor chat message volume
2. Clean up old notifications
3. Update friend recommendation algorithms
4. Monitor social feature usage

### Scaling Considerations
1. Add database indexes for performance
2. Implement message pagination
3. Add chat message archiving
4. Consider chat room limits

## 📚 Additional Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [React Chat UI Best Practices](https://reactjs.org/docs/thinking-in-react.html)
- [Social Features UX Guidelines](https://material.io/design/communication/social.html)
