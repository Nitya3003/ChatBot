import React, { useEffect, useReducer, useRef } from "react";
import { Reload, Rocket, Stop } from "../assets";
import { Chat, New } from "../components";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { setLoading } from "../redux/loading";
import { useDispatch, useSelector } from "react-redux";
import { addList, emptyAllRes, insertNew, livePrompt } from "../redux/messages";
import { emptyUser } from "../redux/user";
import { addHistory } from "../redux/history";
import instance from "../config/instance";
import "./style.scss";

const reducer = (state, { type, status }) => {
  switch (type) {
    case "chat":
      return {
        chat: status,
        loading: status,
        resume: status,
        actionBtns: false,
      };
    case "error":
      return {
        chat: true,
        error: status,
        resume: state.resume,
        loading: state.loading,
        actionBtns: state.actionBtns,
      };
    case "resume":
      return {
        chat: true,
        resume: status,
        loading: status,
        actionBtns: true,
      };
    default:
      return state;
  }
};

const Main = () => {
  let location = useLocation();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const chatRef = useRef();

  const { user } = useSelector((state) => state);

  const { id = null } = useParams();

  const [status, stateAction] = useReducer(reducer, {
    chat: false,
    error: false,
    actionBtns: false,
  });

  useEffect(() => {
    if (user) {
      dispatch(emptyAllRes());
      setTimeout(() => {
        if (id) {
          const getSaved = async () => {
            let res = null;
            try {
              res = await instance.get("/api/chat/saved", {
                params: {
                  chatId: id,
                },
              });
            } catch (err) {
              console.log(err);
              if (err?.response?.data?.status === 404) {
                navigate("/404");
              } else {
                alert(err);
                dispatch(setLoading(false));
              }
            } finally {
              if (res?.data) {
                dispatch(addList({ _id: id, items: res?.data?.data }));
                stateAction({ type: "resume", status: false });
                dispatch(setLoading(false));
              }
            }
          };

          getSaved();
        } else {
          stateAction({ type: "chat", status: false });
          dispatch(setLoading(false));
        }
      }, 1000);
    }
  }, [location]);

  return (
    <div className="main">
      <div className="contentArea">
        {status.chat ? <Chat ref={chatRef} error={status.error} /> : <New />}
      </div>

      <InputArea status={status} chatRef={chatRef} stateAction={stateAction} />
    </div>
  );
};

export default Main;

//Input Area
const InputArea = ({ status, chatRef, stateAction }) => {
  let textAreaRef = useRef();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { prompt, content, _id } = useSelector((state) => state.messages);

  useEffect(() => {
    textAreaRef.current?.addEventListener("input", (e) => {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    });
  });

  const FormHandle = async () => {
    if (prompt?.length > 0) {
      stateAction({ type: "chat", status: true });

      let chatsId = Date.now();

      dispatch(insertNew({ id: chatsId, content: "", prompt }));
      chatRef?.current?.clearResponse();

      let res = null;

      try {
        if (_id) {
          res = await instance.put("/api/chat", {
            chatId: _id,
            prompt,
          });
        } else {
          res = await instance.post("/api/chat", {
            prompt,
          });
        }
      } catch (err) {
        console.log(err);
        if (err?.response?.data?.status === 405) {
          dispatch(emptyUser());
          dispatch(emptyAllRes());
          navigate("/login");
        } else {
          stateAction({ type: "error", status: true });
        }
      } finally {
        if (res?.data) {
          const { _id, content } = res?.data?.data;

          dispatch(insertNew({ _id, fullContent: content, chatsId }));

          chatRef?.current?.loadResponse(stateAction, content, chatsId);

          stateAction({ type: "error", status: false });

          // Refresh history after creating/updating chat
          const refreshHistory = async () => {
            try {
              const historyRes = await instance.get("/api/chat/history");
              if (historyRes?.data?.data) {
                dispatch(addHistory(historyRes.data.data));
              }
            } catch (err) {
              console.log("Error refreshing history:", err);
            }
          };

          // If this is a new chat (POST request), navigate to the chat URL
          if (!_id && res?.data?.data?._id) {
            const newChatId = res.data.data._id;
            refreshHistory();
            // Navigate to the new chat after a short delay to ensure state is updated
            setTimeout(() => {
              navigate(`/chat/${newChatId}`);
            }, 100);
          } else if (_id) {
            // For existing chats, just refresh history
            refreshHistory();
          } else if (res?.data?.data?._id) {
            // Handle case where _id comes from response
            const newChatId = res.data.data._id;
            refreshHistory();
            setTimeout(() => {
              navigate(`/chat/${newChatId}`);
            }, 100);
          }
        }
      }
    }
  };

  return (
    <div className="inputArea">
      {!status.error ? (
        <>
          <div className="chatActionsLg">
            {status.chat && content?.length > 0 && status.actionBtns && (
              <>
                {!status?.resume ? (
                  <button
                    onClick={() => {
                      chatRef.current.loadResponse(stateAction);
                    }}
                  >
                    <Reload /> Regenerate response
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      chatRef.current.stopResponse(stateAction);
                    }}
                  >
                    <Stop /> Stop generating
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flexBody">
            <div className="box">
              <textarea
                placeholder="Send a message..."
                ref={textAreaRef}
                value={prompt}
                onChange={(e) => {
                  dispatch(livePrompt(e.target.value));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (prompt?.length > 0 && !status?.loading) {
                      FormHandle();
                    }
                  }
                }}
              />
              {!status?.loading ? (
                <button onClick={FormHandle}>{<Rocket />}</button>
              ) : (
                <div className="loading">
                  <div className="dot" />
                  <div className="dot-2 dot" />
                  <div className="dot-3 dot" />
                </div>
              )}
            </div>

            {status.chat && content?.length > 0 && status.actionBtns && (
              <>
                {!status?.resume ? (
                  <div className="chatActionsMd">
                    <button
                      onClick={() => {
                        chatRef.current.loadResponse(stateAction);
                      }}
                    >
                      <Reload />
                    </button>
                  </div>
                ) : (
                  <div className="chatActionsMd">
                    <button
                      onClick={() => {
                        chatRef.current.stopResponse(stateAction);
                      }}
                    >
                      <Stop />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="error">
          <p>There was an error generating a response</p>
          <button onClick={FormHandle}>
            <Reload />
            Regenerate response
          </button>
        </div>
      )}

      <div className="text">
        <a
          target="_blank"
          href="https://help.openai.com/en/articles/6825453-chatgpt-release-notes"
        >
          CloudGPT - IGUANA
        </a>{" "}
        Free Research Preview. Our goal is to make AI systems more natural and
        safe to interact with. Your feedback will help us improve.
      </div>
    </div>
  );
};
