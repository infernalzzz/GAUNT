import AchievementNotification from './AchievementNotification'
import { useAchievementNotifications } from '../hooks/useAchievementNotifications'

interface AchievementTrackerProps {
  children: React.ReactNode
}

const AchievementTracker = ({ children }: AchievementTrackerProps) => {
  const { notifications, removeNotification } = useAchievementNotifications()

  return (
    <>
      {children}
      
      {/* Achievement Notifications */}
      {notifications.map((notification) => (
        <AchievementNotification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  )
}

export default AchievementTracker
