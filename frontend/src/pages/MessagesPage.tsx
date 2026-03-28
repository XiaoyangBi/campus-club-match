import { useEffect } from 'react'
import { EmptyState } from '../components/EmptyState'
import { SectionPanel } from '../components/SectionPanel'
import { useMarkNotificationsReadMutation, useStudentDemoNotificationsQuery } from '../hooks/useStudentDemoData'

export function MessagesPage() {
  const notificationsQuery = useStudentDemoNotificationsQuery()
  const markReadMutation = useMarkNotificationsReadMutation()
  const inbox = notificationsQuery.data
  const welcomeNotification = inbox?.notifications.find((item) => item.type === 'system') ?? null

  useEffect(() => {
    const unreadIds = inbox?.notifications.filter((item) => !item.isRead).map((item) => item.id) ?? []

    if (unreadIds.length === 0) {
      return
    }

    void markReadMutation.mutateAsync(unreadIds)
  }, [inbox, markReadMutation])

  return (
    <main className="single-column">
      <SectionPanel
        eyebrow="Inbox"
        title="消息中心"
        description={`当前共有${inbox?.unreadCount ?? 0}条未读消息，覆盖报名提交与状态变化提醒。`}
        actions={
          <button
            type="button"
            className="secondary-button"
            disabled={!inbox || inbox.notifications.length === 0 || markReadMutation.isPending}
            onClick={() => void markReadMutation.mutateAsync(undefined)}
          >
            全部标记已读
          </button>
        }
      >
        {welcomeNotification ? (
          <div className="welcome-message-banner">
            <div>
              <span className="discover-cover-label">Welcome</span>
              <h3>{welcomeNotification.title}</h3>
              <p>{welcomeNotification.content}</p>
            </div>
          </div>
        ) : null}

        {notificationsQuery.isPending ? (
          <EmptyState panel title="消息加载中" description="正在读取你的站内消息，请稍候。" />
        ) : inbox && inbox.notifications.length > 0 ? (
          <div className="message-list">
            {inbox.notifications.map((notification) => (
              <article
                key={notification.id}
                className={
                  notification.type === 'system'
                    ? notification.isRead
                      ? 'message-card accent'
                      : 'message-card unread accent'
                    : notification.isRead
                      ? 'message-card'
                      : 'message-card unread'
                }
              >
                <div className="message-card-top">
                  <strong>{notification.title}</strong>
                  <span className={`status-badge ${notification.isRead ? 'neutral' : 'pending'}`}>
                    {notification.isRead ? '已读' : '未读'}
                  </span>
                </div>
                <p>{notification.content}</p>
                <span className="message-card-time">{notification.createdAt}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState panel title="暂时还没有消息" description="提交报名或状态更新后，系统会把提醒写到这里。" />
        )}
      </SectionPanel>
    </main>
  )
}
