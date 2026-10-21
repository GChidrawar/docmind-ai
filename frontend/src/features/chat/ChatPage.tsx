import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ChatPanel from './ChatPanel'
import { useChatStore } from '../../store/chatStore'

/**
 * "/" = new chat, "/c/:conversationId" = an existing chat.
 * URL and store sync in two one-way steps to avoid ping-pong:
 *  - URL -> store: only when the URL itself changed (link, back/forward, reload)
 *  - store -> URL: when the store gets an id (the first message of a new chat mints one)
 */
export default function ChatPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const activeId = useChatStore((s) => s.activeConversationId)

  useEffect(() => {
    const { activeConversationId, openConversation, startNewChat, sending } = useChatStore.getState()
    if (conversationId) {
      if (conversationId !== activeConversationId) {
        void openConversation(conversationId).then((found) => {
          if (!found) navigate('/', { replace: true })
        })
      }
    } else if (activeConversationId && !sending) {
      startNewChat()
    }
  }, [conversationId])

  useEffect(() => {
    if (activeId && activeId !== conversationId) navigate(`/c/${activeId}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when the store id changes
  }, [activeId])

  return <ChatPanel />
}
