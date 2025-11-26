import { router } from '@inertiajs/react'
import React from 'react'
import { Excalidraw, WelcomeScreen, exportToBlob } from '@excalidraw/excalidraw'
import { Paperclip, Save } from 'lucide-react'
import { useGroupedStories } from '@/lib/utils'
const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(blob)
  })
}

const StoryCard = ({
  story,
  onSelect,
  isSelected = false,
  isCollapsed = false,
  systemColors,
}) => {
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'
  const realStoryId = story.epic_id
    ? `${story.epic_id}.${story.epic_index || 0}`
    : `${story.id}`
  return (
    <div
      onClick={onSelect}
      className={`
        flex flex-col h-full items-center justify-start p-2 gap-1 text-sm font-normal text-foreground cursor-pointer
        border border-border bg-card rounded-md shadow-sm transition-opacity duration-300 ${isSelected ? ' border-primary' : 'border-accent'}
        `}
    >
      {story && (
        <div className="mr-auto">
          <Badge style={{ backgroundColor: selectedVariant }} variant="badge">
            {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`.toUpperCase()}
          </Badge>
        </div>
      )}
      {!isCollapsed && (
        <p className="text-left">{story?.title || 'Selecione uma story'}</p>
      )}
    </div>
  )
}

const Storyboards = ({ project }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)
  const [sceneData, setSceneData] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedStory, setSelectedStory] = useState(null)
  const [sceneVersion, setSceneVersion] = useState(0)
  const childrenByEpicId = useGroupedStories(project?.stories)

  const fileInputRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { open, setOpen } = useSidebar()

  useEffect(() => {
    const html = document.querySelector('html')
    setIsDarkMode(html.classList.contains('dark'))
  }, [])

  useEffect(() => {
    // 1. Se não houver story selecionada, limpa os dados e termina.
    if (!selectedStory) {
      setSceneData({ elements: [], files: {} })
      return
    }
    setSceneData(null)
    // Este useEffect agora PREPARA os dados ANTES de renderizar o Excalidraw
    const prepareInitialScene = async () => {
      setSceneData(null)
      // --- Adição importante: reseta a versão para a nova story ---
      setSceneVersion(0)
      const currentStoryboard = project.storyboards.find(
        (sb) => sb.story_id === selectedStory.id,
      )

      const imageUrl = currentStoryboard?.image_url

      // Se não houver imagem, preparamos uma cena vazia e terminamos
      if (!imageUrl) {
        setSceneData({
          elements: [],
          files: {},
        })
        return
      }

      console.log('⏳ Preparando cena inicial com a imagem:', imageUrl)
      try {
        const response = await fetch(imageUrl, { mode: 'cors' })
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`)
        const blob = await response.blob()
        const dataURL = await blobToDataURL(blob)

        const img = new Image()
        img.onload = () => {
          const fileId = `storyboard-file-${Date.now()}`

          const imageElement = {
            id: `storyboard-element-${Date.now()}`,
            type: 'image',
            fileId,
            status: 'saved',
            x: 50,
            y: 50,
            width: img.width,
            height: img.height,
            boundElements: [],
            groupIds: [],
            isDeleted: false,
            angle: 0,
            locked: false,
            opacity: 100,
            seed: Math.floor(Math.random() * 1000000),
            version: 3,
            versionNonce: Math.floor(Math.random() * 1000000),
            updated: Date.now(),
            frameId: null,
            link: null,
            roundness: null,
            strokeStyle: 'solid',
            strokeWidth: 1,
            strokeColor: '#000000',
            backgroundColor: 'transparent',
            fillStyle: 'hachure',
            roughness: 1,
          }

          const files = {
            [fileId]: {
              mimeType: blob.type,
              id: fileId,
              dataURL,
              created: Date.now(),
            },
          }

          console.log(
            '✅ Dados da cena prontos para serem injetados via initialData.',
          )
          setSceneData({
            elements: [imageElement],
            files: files,
          })
        }
        img.src = dataURL
      } catch (error) {
        console.error('Erro ao preparar a cena inicial:', error)
        setSceneData({ elements: [], files: {} })
      }
    }
    // prepareInitialScene()
    setTimeout(prepareInitialScene, 0)
  }, [selectedStory, project.storyboards]) // Roda apenas se a URL da imagem mudar

  // Adicione esta função completa dentro do seu componente Editor
  // Substitua sua função handleFileChange inteira por esta.

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !excalidrawAPI) {
      return
    }

    try {
      // 1. Captura o estado ATUAL do canvas
      const existingElements = excalidrawAPI.getSceneElements()
      const existingFiles = excalidrawAPI.getFiles()

      // 2. Prepara os dados do NOVO arquivo
      const dataURL = await blobToDataURL(file)
      const img = new Image()
      img.onload = () => {
        const fileId = `file-${Date.now()}`

        const newImageElement = {
          id: `element-${Date.now()}`,
          type: 'image',
          fileId,
          status: 'saved',
          x: excalidrawAPI.getAppState().scrollX + 100,
          y: excalidrawAPI.getAppState().scrollY + 100,
          width: img.width,
          height: img.height,
          // ... resto das propriedades seguras ...
          boundElements: [],
          groupIds: [],
          isDeleted: false,
          angle: 0,
          locked: false,
          opacity: 100,
          seed: Math.floor(Math.random() * 1000000),
          version: 3,
          versionNonce: Math.floor(Math.random() * 1000000),
          updated: Date.now(),
        }

        const newFileData = {
          [fileId]: {
            mimeType: file.type,
            id: fileId,
            dataURL,
            created: Date.now(),
          },
        }

        // 3. Cria a nova cena completa, unindo o antigo e o novo
        const newCompleteScene = {
          elements: [...existingElements, newImageElement],
          files: { ...existingFiles, ...newFileData },
        }

        // 4. Atualiza o estado da cena E incrementa a versão para forçar a remontagem
        setSceneData(newCompleteScene)
        setSceneVersion((prevVersion) => prevVersion + 1)

        console.log('✅ Cena atualizada com anexo. Forçando remontagem.')
      }
      img.src = dataURL
    } catch (error) {
      console.error('Erro ao processar anexo para remontagem:', error)
      alert('Não foi possível carregar o anexo.')
    } finally {
      if (event.target) event.target.value = ''
    }
  }

  const handleInsertAttachmentClick = () => {
    // Se a referência existir, simula um clique nela
    fileInputRef.current?.click()
  }
  const handleSaveCanvas = async () => {
    if (!excalidrawAPI || !selectedStory) {
      alert('Por favor, selecione uma story antes de salvar.')
      return
    }

    try {
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
        mimeType: 'image/png',
      })

      const imageFile = new File(
        [blob],
        `storyboard_story_id=${selectedStory.id}.png`,
        {
          type: 'image/png',
        },
      )

      const formData = {
        image: imageFile,
        story_id: selectedStory.id,
        project_id: project.id,
      }

      router.post(route('storyboard.store'), formData, {
        onStart: () => {
          setIsProcessing(true)
        },
        onSuccess: () => {
          console.log('Storyboard salvo com sucesso!')
        },
        onError: (errors) => {
          console.error('Erro ao salvar:', errors)
          alert('Ocorreu um erro ao salvar o storyboard.')
        },
        onFinish: () => {
          setIsProcessing(false)
        },
      })
    } catch (error) {
      console.error('Erro ao exportar o canvas:', error)
      alert('Não foi possível gerar a imagem do canvas.')
    }
  }

  return (
    <div className="w-full mt-2 flex" style={{ height: 'calc(100vh - 105px)' }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg, image/gif, image/svg+xml"
        onChange={handleFileChange} // A função que vamos criar
      />
      <section
        className={`${open ? ' w-1/5' : 'w-24'} transition-all  grid grid-cols-1 h-full`}
      >
        <Sidebar
          style={{ '--width': open ? '100%' : '4.8rem' }}
          collapsible={true}
          className="relative z-40 w-[--width] h-full"
        >
          <SidebarHeader
            className={`${open ? 'items-end flex-row justify-evenly' : 'items-center'}  w-full text-foreground`}
          >
            {!open ? (
              <></>
            ) : (
              <>
                <p className="text-2xl"> Stories</p>
              </>
            )}

            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="gap-2">
              {project?.stories
                ?.sort((b, a) => a.type.localeCompare(b.type))
                .map((story) => {
                  return (
                    <StoryCard
                      key={story.id}
                      story={story}
                      isCollapsed={!open}
                      isSelected={story.id === selectedStory?.id}
                      onSelect={() => {
                        setSelectedStory(story)
                      }}
                      systemColors={project?.system_colors}
                    />
                  )
                })}
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </section>
      <div className="excalidraw-wrapper flex-1 relative w-[85%] h-full">
        {/* RENDERIZAÇÃO CONDICIONAL */}
        {!sceneData ? (
          <div className="w-full h-full flex items-center justify-center bg-card text-foreground">
            Carregando storyboard...
          </div>
        ) : (
          <Excalidraw
            key={`${selectedStory?.id || 'no-story'}-${sceneVersion}`}
            initialData={sceneData}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            renderTopRightUI={() => (
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      className="size-10"
                      onClick={handleInsertAttachmentClick}
                    >
                      <Paperclip />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Inserir anexo</TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="secondary"
                        className="size-10"
                        onClick={handleSaveCanvas}
                        disabled={isProcessing || !selectedStory}
                      >
                        <Save />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Salvar Storyboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            langCode="pt-BR"
            theme={isDarkMode ? 'light' : 'light'}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: true,
                clearCanvas: true,
                export: false,
                loadScene: true,
                saveAsImage: true,
                saveToActiveFile: true,
                toggleTheme: true,
                saveFileToDisk: false,
              },
              tools: {
                image: true,
              },
            }}
          >
            <WelcomeScreen>
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.MenuHint />
            </WelcomeScreen>
          </Excalidraw>
        )}
      </div>
    </div>
  )
}

export default Storyboards
