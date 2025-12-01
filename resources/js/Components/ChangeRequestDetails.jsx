import { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

const ChangeRequestDetails = ({ request, onClose }) => {
  const [status, setStatus] = useState(request.status)
  const [loading, setLoading] = useState(false)

  // Opções de status baseadas na sua metodologia
  const statusOptions = [
    { value: 'SOLICITADA', label: 'Solicitada', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'EM_ANALISE', label: 'Em Análise', color: 'bg-orange-100 text-orange-800' },
    { value: 'REJEITADA', label: 'Rejeitada', color: 'bg-red-100 text-red-800' },
    { value: 'IMPLEMENTADA', label: 'Implementada', color: 'bg-blue-100 text-blue-800' },
  ]

  const handleSave = () => {
    setLoading(true)
    
    router.patch(
      route('change-request.update', request.id),
      { status: status },
      {
        onSuccess: () => {
          setLoading(false)
          if (onClose) onClose()
        },
        onError: () => setLoading(false),
      }
    )
  }

  const currentStatusObj = statusOptions.find((s) => s.value === status) || statusOptions[0]

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex justify-between items-start">
          <div>
            <DialogTitle className="text-xl">Solicitação #{request.id}</DialogTitle>
            <DialogDescription>
              Criada em {new Date(request.request_date).toLocaleDateString('pt-BR')}
            </DialogDescription>
          </div>
          <Badge className={currentStatusObj.color}>
            {currentStatusObj.label}
          </Badge>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solicitante */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase font-bold">Solicitante</Label>
          <div className="p-2 bg-secondary/20 rounded-md text-sm font-medium">
            {request.requester_name || 'N/A'}
          </div>
        </div>

        {/* Status (Editável) */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase font-bold">Status Atual</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Descrição Completa */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase font-bold">Descrição da Mudança</Label>
        <div className="w-full rounded-md border p-4 bg-muted/10 text-sm leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {request.description}
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Fechar
        </Button>
        <Button onClick={handleSave} disabled={loading || status === request.status}>
          {loading ? 'Salvando...' : 'Atualizar Status'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default ChangeRequestDetails