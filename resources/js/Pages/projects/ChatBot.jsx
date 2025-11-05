import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, SendHorizontal, LoaderCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const AIMessage = ({ fullContent, animate }) => {
  const [displayedContent, setDisplayedContent] = useState(
    animate ? '' : fullContent,
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedContent((prev) => fullContent.slice(0, prev.length + 1))
    }, 20)
    return () => clearInterval(interval)
  }, [fullContent, displayedContent])

  const isTyping = displayedContent.length < fullContent.length
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

const ChatBot = ({ project, currentPage, currentContextData }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      message:'Olá! 👋 Eu sou seu assistente REACT-M e atuarei como seu Facilitador. Como posso **guiar** você ou sua equipe na cerimônia de hoje?',
      sender: 'bot',
      timestamp: new Date().toISOString(),
    },
  ])
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatBodyRef = useRef(null)

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const toggleChat = () => {
    setIsOpen((prevState) => !prevState)
  }

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || !project.id) return

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      message: inputMessage,
      created_at: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage('')
    setIsLoading(true)
    console.log('currentContextData:', currentContextData)
    try {
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute('content')

      const response = await fetch(route('chat.store', project.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          message: userMessage.message,
          page_context: currentPage,
          //context_data: currentContextData,
          history: newMessages.map((m) => ({
            sender: m.sender,
            message: m.message,
          })), // Envia o histórico
        }),
      })
      if (!response.ok) {
        throw new Error('A resposta da rede não foi bem-sucedida.')
      }
      const aiMessageId = `ai-${Date.now()}`
      const placeholderMessage = {
        id: aiMessageId,
        message: '',
        sender: 'model',
        timestamp: new Date().toISOString(),
      }

      setMessages((prevMessages) => [...prevMessages, placeholderMessage])

      //leitor do corpo da respost
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, message: msg.message + chunk }
              : msg,
          ),
        )
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = {
        id: `temp-error-${Date.now()}`,
        message:
          'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

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
                Assistente Virtual
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
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1
                const shouldAnimate = isLastMessage && isLoading
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
                            animate={shouldAnimate}
                          />
                        ) : (
                          // A mensagem do usuário não precisa do efeito
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
              {isLoading && (
                <div className="flex items-center gap-2.5 justify-start">
                  <div className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 flex items-center">
                    <LoaderCircle className="animate-spin size-4" />
                  </div>
                </div>
              )}
            </main>

            <div className="p-4 border-t border-border bg-card rounded-b-lg">
              <div className="flex items-center space-x-2">
                <Input
                  disabled={isLoading}
                  type="text"
                  placeholder="Digite sua pergunta..."
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
                  aria-label="Enviar mensagem"
                  onClick={handleSendMessage}
                >
                  <SendHorizontal className="size-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={toggleChat}
        size="icon"
        className="fixed bottom-2 right-2 size-12 rounded-full shadow-lg transition-transform transform hover:scale-110 z-50"
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
        aria-expanded={isOpen}
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
      </Button>
    </>
  )
}

export default ChatBot
