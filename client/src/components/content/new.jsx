import React, { memo } from 'react'
import './style.scss'

const New = memo(() => {
  return (
    <div className='New'>
      <div className='logo-section'>
        <div className='logo-container'>
          <div className='logo-square'>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className='title-section'>
          <h1 className='title'>CloudGPT – IGUANA</h1>
          <p className='subtitle'>Intelligent AI Assistant</p>
        </div>
      </div>

      <div className='prompt-text'>
        <h2>Ask me anything.</h2>
      </div>
    </div>
  )
})

export default New
