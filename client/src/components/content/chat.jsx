import React, {
  forwardRef,
  Fragment,
  useImperativeHandle,
  useRef
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GptIcon, Avatar } from '../../assets'
import { insertNew } from '../../redux/messages'
import './style.scss'

/* =========================
   TIMESTAMP HELPERS
========================= */
const extractTimestamp = (idOrTimestamp) => {
  if (!idOrTimestamp) return Date.now()

  if (typeof idOrTimestamp === 'number') return idOrTimestamp

  if (typeof idOrTimestamp === 'string' && /^\d+$/.test(idOrTimestamp)) {
    return parseInt(idOrTimestamp)
  }

  if (typeof idOrTimestamp === 'string' && idOrTimestamp.length === 24) {
    try {
      return parseInt(idOrTimestamp.substring(0, 8), 16) * 1000
    } catch {
      return Date.now()
    }
  }

  return Date.now()
}

const formatTimestamp = (timestamp) => {
  const now = new Date()
  const msgDate = new Date(extractTimestamp(timestamp))
  const diffInDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`

  return msgDate.toLocaleDateString()
}

/* =========================
   CHAT COMPONENT
========================= */
const Chat = forwardRef(({ error }, ref) => {
  const dispatch = useDispatch()
  const contentRef = useRef(null)
  const intervalRef = useRef(null)

  const { messages } = useSelector((state) => state)
  const { latest, content, all } = messages

  const stopResponse = (stateAction) => {
    if (contentRef.current) {
      contentRef.current.classList.remove('blink')
    }
    stateAction({ type: 'resume', status: false })
    clearInterval(intervalRef.current)
  }

  const loadResponse = (
    stateAction,
    response = content,
    chatsId = latest?.id
  ) => {
    clearInterval(intervalRef.current)
    stateAction({ type: 'resume', status: true })

    if (contentRef.current) {
      contentRef.current.classList.add('blink')
      contentRef.current.innerHTML = ''
    }

    let index = 0

    intervalRef.current = setInterval(() => {
      if (index < response.length && contentRef.current) {
        const char = response.charAt(index)

        dispatch(insertNew({
          chatsId,
          content: char,
          resume: index !== 0
        }))

        contentRef.current.innerHTML += char
        index++
      } else {
        stopResponse(stateAction)
      }
    }, 20)
  }

  useImperativeHandle(ref, () => ({
    stopResponse,
    loadResponse,
    clearResponse: () => {
      if (contentRef.current) {
        contentRef.current.innerHTML = ''
        contentRef.current.classList.add('blink')
      }
    }
  }))

  return (
    <div className='Chat'>
      {
        all?.filter(obj => !obj.id || obj.id !== latest?.id)
          ?.map((obj) => {
            const key = obj?.chatId || obj?.id || Math.random()
            const timestamp = obj?.timestamp || obj?.id || Date.now()

            return (
              <Fragment key={key}>
                {/* USER MESSAGE */}
                <div className='message-wrapper user-message'>
                  <div className='message-bubble user-bubble'>
                    <div className='message-content'>{obj?.prompt}</div>
                    <div className='message-timestamp'>
                      {formatTimestamp(timestamp)}
                    </div>
                  </div>
                  <div className='message-avatar user-avatar'>
                    <Avatar />
                  </div>
                </div>

                {/* AI MESSAGE */}
                <div className='message-wrapper ai-message'>
                  <div className='message-avatar ai-avatar'>
                    <GptIcon />
                  </div>
                  <div className='message-bubble ai-bubble'>
                    <div className='message-content'>
                      <span>{obj?.content}</span>
                    </div>
                  </div>
                </div>
              </Fragment>
            )
          })
      }

      {
        latest?.prompt && (
          <Fragment>
            {/* USER MESSAGE */}
            <div className='message-wrapper user-message'>
              <div className='message-bubble user-bubble'>
                <div className='message-content'>{latest.prompt}</div>
                <div className='message-timestamp'>
                  {formatTimestamp(latest?.id || Date.now())}
                </div>
              </div>
              <div className='message-avatar user-avatar'>
                <Avatar />
              </div>
            </div>

            {/* AI MESSAGE */}
            <div className='message-wrapper ai-message'>
              <div className='message-avatar ai-avatar'>
                <GptIcon />
                {error && <span className='error-badge'>!</span>}
              </div>
              <div className='message-bubble ai-bubble'>
                <div className='message-content'>
                  {
                    error ? (
                      <div className="error">
                        Something went wrong while generating the response.
                        Please try again or re-login.
                      </div>
                    ) : (
                      <span ref={contentRef} className="blink" />
                    )
                  }
                </div>
              </div>
            </div>
          </Fragment>
        )
      }
    </div>
  )
})

export default Chat
