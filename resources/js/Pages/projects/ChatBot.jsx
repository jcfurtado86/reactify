import { router } from '@inertiajs/react'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, SendHorizontal, LoaderCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'

const AIMessage = ({ fullContent, animate }) => {
  const [displayedContent, setDisplayedContent] = useState(
    animate ? '' : fullContent,
  )

  useEffect(() => {
    if (animate) {
      const interval = setInterval(() => {
        setDisplayedContent((prev) => fullContent.slice(0, prev.length + 1))
      }, 20)

      return () => clearInterval(interval)
    } else {
      setDisplayedContent(fullContent)
    }
  }, [fullContent, animate]) // MUDANÇA: Depende de 'fullContent' e 'animate'

  const isTyping = animate && displayedContent.length < fullContent.length
  return (
    <>
      <div
        className={`inline prose-container prose prose-sm dark:prose-invert text-secondary-foreground max-w-none ${isTyping ? 'is-typing' : ''}`}
      >
        <ReactMarkdown>{displayedContent}</ReactMarkdown>
      </div>
      {isTyping && <span className="blinking-cursor bg-primary">||</span>}
    </>
  )
}

/**
 * Componente principal do ChatBot, agora com WebSockets (Laravel Echo).
 */
const ChatBot = ({ project, currentPage, currentContextData }) => {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([
    {
      id: 1,
      message: t('chat.welcome'),
      sender: 'bot',
      timestamp: new Date().toISOString(),
      animate: false,
    },
  ])
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatBodyRef = useRef(null)

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, isOpen])

  // NOVO EFEITO PARA OUVIR O WEBSOCKET (LARAVEL ECHO)
  useEffect(() => {
    // Só liga o Echo se o chat estiver aberto e tivermos um projeto
    if (!project?.id || !isOpen) {
      return
    }

    // Entra no canal privado do projeto (definido em routes/channels.php)
    const channel = window.Echo.private(`project.${project.id}`)

    // Ouve o evento 'chat.message.received' (definido em App/Events/ChatMessageReceived.php)
    channel.listen('.chat.message.received', (event) => {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        message: event.message, // A mensagem vem do broadcast
        sender: 'model',
        timestamp: new Date().toISOString(),
        animate: true,
      }

      setIsLoading(false)

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === 'ai-loading-placeholder' ? aiMessage : msg,
        ),
      )
    })

    // Sai do canal quando o chat é fechado ou o componente desmonta
    return () => {
      channel.stopListening('.chat.message.received')
      window.Echo.leaveChannel(`project.${project.id}`)
    }
  }, [project, isOpen]) // Re-executa se o projeto ou o estado 'aberto' mudar

  // Envia a mensagem para a FILA (via ChatController)
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || !project.id) return

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      message: inputMessage,
      created_at: new Date().toISOString(),
      animate: false,
    }

    const newMessages = [...messages, userMessage]

    const placeholderMessage = {
      id: 'ai-loading-placeholder',
      message: '',
      sender: 'model',
      timestamp: new Date().toISOString(),
      isLoading: true,
    }

    setMessages([...newMessages, placeholderMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const data = {
        message: userMessage.message,
        page_context: currentPage,
        history: newMessages.map((m) => ({
          sender: m.sender,
          message: m.message,
        })),
      }

      router.post(route('chat.store', project.id), data, {
        preserveState: true,
        preserveScroll: true,
        onError: (errors) => {
          const firstError = errors[Object.keys(errors)[0]]
          throw new Error(firstError || t('chat.error_request'))
        },
      })
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = {
        id: `temp-error-${Date.now()}`,
        message: t('chat.error_response', { message: error.message }),
        sender: 'ai',
        timestamp: new Date().toISOString(),
        animate: false,
      }
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === 'ai-loading-placeholder' ? errorMessage : msg,
        ),
      )
      setIsLoading(false)
    }
  }

  const toggleChat = () => setIsOpen(!isOpen)

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-[calc(4.5rem)] right-5 w-96 max-w-md h-[35rem] bg-card border border-border rounded-lg shadow-2xl flex flex-col z-40"
            role="dialog"
          >
            <header className="flex justify-between items-center p-4 bg-primary text-primary-foreground rounded-t-lg">
              <h3 id="chat-heading" className="text-base font-semibold">
                {t('chat.title')}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="size-5 hover:bg-primary/80"
              >
                <X className="size-5" />
              </Button>
            </header>

            <main
              ref={chatBodyRef}
              className="flex-1 text-sm font-normal p-4 overflow-y-auto bg-background flex flex-col gap-4"
            >
              {messages.map((message) => {
                if (message.isLoading) {
                  return (
                    <div
                      key={message.id}
                      className="flex items-center gap-2.5 justify-start"
                    >
                      <div className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 flex items-center">
                        <LoaderCircle className="animate-spin size-4" />
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={message.id}
                    className={`flex relative gap-2.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg text-left px-3 py-2 ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    >
                      <div
                        className={`${message.sender === 'user' ? ' text-primary-foreground' : 'text-secondary-foreground'}`}
                      >
                        {message.sender !== 'user' ? (
                          <AIMessage
                            fullContent={message.message}
                            animate={message.animate}
                          />
                        ) : (
                          <div className="prose-container prose prose-sm">
                            <ReactMarkdown>{message.message}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                      }}
                      className={`absolute bottom-0 size-3 block translate-y-1/2 ${message.sender === 'user' ? 'bg-primary text-primary-foreground -rotate-45 translate-x-1/2' : 'bg-secondary text-secondary-foreground rotate-45 -translate-x-1/2'}`}
                    />
                  </div>
                )
              })}
            </main>

            <footer className="p-4 border-t border-border bg-card rounded-b-lg">
              <div className="flex items-center space-x-2">
                <Input
                  disabled={isLoading}
                  type="text"
                  placeholder={t('chat.placeholder')}
                  className="flex-1 font-normal"
                  value={inputMessage}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleSendMessage()
                    }
                  }}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <Button
                  disabled={isLoading}
                  size="icon"
                  aria-label={t('chat.send')}
                  onClick={handleSendMessage}
                >
                  <SendHorizontal className="size-5" />
                </Button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <ButtonWithTooltip
        onClick={toggleChat}
        size="icon"
        className="fixed bottom-2 right-2 size-12 rounded-full shadow-lg transition-transform transform hover:scale-110 z-50"
        aria-label={isOpen ? t('chat.close_chat') : t('chat.open_chat')}
        aria-expanded={isOpen}
        tooltipContent={isOpen ? null : <div>{t('chat.title')}</div>}
        side="left"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'chat'}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="size-8" />
            ) : (
              <MessageSquare className="size-8" />
            )}
          </motion.div>
        </AnimatePresence>
      </ButtonWithTooltip>
    </>
  )
}

export default ChatBot
