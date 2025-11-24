import React, { Fragment, useEffect, useRef, useState } from 'react'
import {
  Avatar, Bar, LogOut, Message, Plus, Settings, Tab, Tick, Trash, Xicon
} from '../../assets/'
import { emptyUser } from '../../redux/user'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { activePage, addHistory } from '../../redux/history'
import instance from '../../config/instance'
import './style.scss'

const Menu = ({ changeColorMode }) => {
  let path = window.location.pathname

  const menuRef = useRef(null)
  const btnRef = useRef(null)
  const settingRef = useRef(null)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { history, user } = useSelector((state) => state)
  const [confirm, setConfim] = useState(false)

  const logOut = async () => {
    if (window.confirm("Do you want log out")) {
      let res = null
      try {
        res = await instance.get('/api/user/logout')
      } catch (err) {
        alert(err)
      } finally {
        if (res?.data?.status === 200) {
          alert("Done")
          dispatch(emptyUser())
          navigate('/login')
        }
      }
    }
  }

  const clearHistory = async (del) => {
    if (del) {
      let res = null

      try {
        res = instance.delete('/api/chat/all')
      } catch (err) {
        alert("Error")
        console.log(err)
      } finally {
        if (res) {
          navigate('/chat')
          dispatch(addHistory([]))
        }

        setConfim(false)
      }
    } else {
      setConfim(true)
    }
  }

  const showMenuMd = () => {
    menuRef.current.classList.add("showMd")
    document.body.style.overflowY = "hidden"
  }

  //Menu

  useEffect(() => {
    window.addEventListener('click', (e) => {
      if (!menuRef?.current?.contains(e.target)
        && !btnRef?.current?.contains(e.target)) {
        menuRef?.current?.classList?.remove("showMd")
        document.body.style.overflowY = "auto"
      }
    })

    window.addEventListener('resize', () => {
      if (!window.matchMedia("(max-width:767px)").matches) {
        document.body.style.overflowY = "auto"
      } else {
        if (menuRef?.current?.classList?.contains('showMd')) {
          document.body.style.overflowY = "hidden"
        } else {
          document.body.style.overflowY = "auto"
        }
      }
    })
  })

  // History Get - Refresh when path changes or when user is logged in
  useEffect(() => {
    const getHistory = async () => {
      let res = null
      try {
        res = await instance.get('/api/chat/history')
      } catch (err) {
        console.log(err)
      } finally {
        if (res?.data?.data) {
          dispatch(addHistory(res?.data?.data))
        }
      }
    }

    // Only fetch history if user is logged in
    if (user) {
      getHistory()
    }
  }, [path, user, dispatch])

  // History active
  useEffect(() => {
    setConfim(false)
    let chatId = null
    if (path.startsWith('/chat/') && path.length > 7) {
      chatId = path.replace('/chat/', '').replace('/', '')
    }
    dispatch(activePage(chatId))
  }, [path, history, dispatch])

  return (
    <Fragment>
      <Modal
        changeColorMode={changeColorMode}
        settingRef={settingRef}
      />

      <header >
        <div className='start'>
          <button onClick={showMenuMd} ref={btnRef}><Bar /></button>
        </div>

        <div className='title'>
          {
            (path.length > 6 && path.startsWith('/chat/')) ? history[0]?.prompt : 'New chat'
          }
        </div>

        <div className='end'>
          <button onClick={() => {
            // Always navigate to home to start a new chat
            navigate('/')
          }}><Plus /></button>
        </div>
      </header>

      <div className="menu" ref={menuRef}>
        <div className="menu-header">
          <div className="menu-logo-section">
            <div className="menu-logo-square">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="menu-title-section">
              <h2 className="menu-title">CloudGPT - IGUANA</h2>
              <p className="menu-subtitle">Intelligent AI Assistant</p>
            </div>
          </div>
          <button
            type='button'
            className='new-chat-btn'
            aria-label='new'
            onClick={() => {
              // Navigate to home to start a new chat (previous chats are preserved)
              navigate('/')
            }}
          >
            <Plus />New Chat
          </button>
        </div>

        <div className="history">
          {history?.length > 0 && (
            <div className="history-heading">Recent Chats</div>
          )}
          {
            history?.map((obj, key) => {
              if (obj?.active) {
                return (
                  <button key={key}
                    className='active'
                    onClick={() => {
                      navigate(`/chat/${obj?.chatId}`)
                    }}
                  >
                    <Message />
                    <span>{obj?.prompt}</span>
                  </button>
                )
              } else {
                return (
                  <button key={key}
                    onClick={() => {
                      navigate(`/chat/${obj?.chatId}`)
                    }}
                  >
                    <Message />
                    <span>{obj?.prompt}</span>
                  </button>)
              }
            })
          }
        </div>

        <div className="actions">
          {
            history?.length > 0 && (
              <>
                {
                  confirm ? <button onClick={() => clearHistory(true)}><Tick />Confirm clear conversations</button>
                    : <button onClick={() => clearHistory(false)}><Trash />Clear conversations</button>
                }
              </>
            )
          }
          <button><Avatar />Upgrade to Plus <span>New</span></button>
          <button onClick={() => {
            if (settingRef?.current) {
              settingRef.current.classList.add("clicked")
              settingRef.current.style.display = 'flex'
            }
          }} ><Settings />Settings</button>
          <button onClick={() => {
            window.open('https://help.openai.com/en/collections/3742473-chatgpt', '_blank')
          }}><Tab />Get help</button>
          <button onClick={logOut} >
            <LogOut />Log out
          </button>
        </div>
      </div >

      <div className="exitMenu">
        <button><Xicon /></button>
      </div>
    </Fragment>
  )
}

export default Menu

const Modal = ({ changeColorMode, settingRef }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const deleteAccount = async () => {
    if (window.confirm("Do you want delete your account")) {

      let res = null
      try {
        res = await instance.delete('/api/user/account')
      } catch (err) {
        console.log(err)
        if (err?.response?.data?.status === 405) {
          alert("Not Logged")
          dispatch(emptyUser())
          navigate('/login')
        } else {
          alert(err)
        }
      } finally {
        alert("Success")
        dispatch(emptyUser())
        navigate('/login')
      }
    }
  }

  return (
    <div className="settingsModal" ref={settingRef} onClick={(e) => {
      let inner = settingRef.current.childNodes
      if (!inner?.[0]?.contains(e.target)) {
        settingRef.current.style.display = 'none'
      }
    }}>
      <div className="inner">
        <div className='content top'>
          <h3>Settings</h3>
          <button onClick={() => {
            settingRef.current.style.display = 'none'
          }}><Xicon /></button>
        </div>
        <div className='content ceneter'>
          <p>Dark mode</p>
          <button
            onClick={() => {
              let mode = localStorage.getItem('darkMode')
              if (mode) {
                changeColorMode(false)
              } else {
                changeColorMode(true)
              }
            }
            }
            role='switch' type='button'>
            <div></div>
          </button>
        </div>
        <div className="bottum">
          <button>Export data</button>
          <button className='end' onClick={deleteAccount}>Delete account</button>
        </div>
      </div>
    </div>
  )
}