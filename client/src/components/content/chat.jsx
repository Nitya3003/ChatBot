import React, {
  forwardRef,
  Fragment,
  useImperativeHandle, useRef
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GptIcon, Avatar } from '../../assets'
import { insertNew } from '../../redux/messages'
import './style.scss'

// Helper function to extract timestamp from ObjectId or use provided timestamp
const extractTimestamp = (idOrTimestamp) => {
  if (!idOrTimestamp) return Date.now()
  
  // If it's a number (Date.now()), use it directly
  if (typeof idOrTimestamp === 'number') {
    return idOrTimestamp
  }
  
  // If it's a string that looks like a number, parse it
  if (typeof idOrTimestamp === 'string' && /^\d+$/.test(idOrTimestamp)) {
    return parseInt(idOrTimestamp)
  }
  
  // If it's an ObjectId (24 hex characters), extract timestamp from it
  if (typeof idOrTimestamp === 'string' && idOrTimestamp.length === 24) {
    try {
      const timestamp = parseInt(idOrTimestamp.substring(0, 8), 16) * 1000
      return timestamp
    } catch (e) {
      return Date.now()
    }
  }
  
  return Date.now()
}

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  
  const now = new Date()
  const msgDate = new Date(extractTimestamp(timestamp))
  const diffInMs = now - msgDate
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return '1 day ago'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return msgDate.toLocaleDateString()
  }
}

const Chat = forwardRef(({ error }, ref) => {

  const dispatch = useDispatch()

  const contentRef = useRef()

  const { user, messages } = useSelector((state) => state)
  const { latest, content, all } = messages

  const loadResponse = (stateAction,
    response = content,
    chatsId = latest?.id) => {

    clearInterval(window.interval)

    stateAction({ type: 'resume', status: true })

    contentRef?.current?.classList?.add("blink")

    let index = 0

    window.interval = setInterval(() => {
      if (index < response.length && contentRef?.current) {
        if (index === 0) {
          dispatch(insertNew({ chatsId, content: response.charAt(index) }))
          contentRef.current.innerHTML = response.charAt(index)
        } else {
          dispatch(insertNew({ chatsId, content: response.charAt(index), resume: true }))
          contentRef.current.innerHTML += response.charAt(index)
        }
        index++
      } else {
        stopResponse(stateAction)
      }
    }, 20)

  }

  const stopResponse = (stateAction) => {
    if (contentRef?.current) {
      contentRef.current.classList.remove('blink')
    }
    stateAction({ type: 'resume', status: false })
    clearInterval(window.interval)
  }

  useImperativeHandle(ref, () => ({
    stopResponse,
    loadResponse,
    clearResponse: () => {
      if (contentRef?.current) {
        contentRef.current.innerHTML = ''
        contentRef?.current?.classList.add("blink")
      }
    }
  }))

  return (
    <div className='Chat'>
      {
        all?.filter((obj) => {
          return !obj.id ? true : obj?.id !== latest?.id
        })?.map((obj, key) => {
          const timestamp = obj?.timestamp || obj?.id || obj?.chatId || Date.now()
          return (
            <Fragment key={key}>
              {/* User Message - Right Aligned */}
              <div className='message-wrapper user-message'>
                <div className='message-bubble user-bubble'>
                  <div className='message-content'>
                    {obj?.prompt}
                  </div>
                  <div className='message-timestamp'>
                    {formatTimestamp(timestamp)}
                  </div>
                </div>
                <div className='message-avatar user-avatar'>
                  <Avatar />
                </div>
              </div>

              {/* AI Message - Left Aligned */}
              <div className='message-wrapper ai-message'>
                <div className='message-avatar ai-avatar'>
                  <GptIcon />
                </div>
                <div className='message-bubble ai-bubble'>
                  <div className='message-content'>
                    <span>
                      {obj?.content}
                    </span>
                  </div>
                </div>
              </div>
            </Fragment>
          )
        })
      }

      {
        latest?.prompt?.length > 0 && (
          <Fragment>
            {/* User Message - Right Aligned */}
            <div className='message-wrapper user-message'>
              <div className='message-bubble user-bubble'>
                <div className='message-content'>
                  {latest?.prompt}
                </div>
                <div className='message-timestamp'>
                  {formatTimestamp(latest?.id || Date.now())}
                </div>
              </div>
              <div className='message-avatar user-avatar'>
                <Avatar />
              </div>
            </div>

            {/* AI Message - Left Aligned */}
            <div className='message-wrapper ai-message'>
              <div className='message-avatar ai-avatar'>
                <GptIcon />
                {error && <span className='error-badge'>!</span>}
              </div>
              <div className='message-bubble ai-bubble'>
                <div className='message-content'>
                  {
                    error ? <div className="error">
                      Something went wrong. If this issue persists please contact us through our help center at help.openai.com.
                    </div> : <span ref={contentRef} className="blink" />
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