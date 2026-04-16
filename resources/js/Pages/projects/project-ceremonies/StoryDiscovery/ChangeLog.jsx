import { router } from '@inertiajs/react'
import ChangeRequestForm from '../../../../Components/ChangeRequestForm'
import ChangeRequestDetails from '../../../../Components/ChangeRequestDetails'
import { useState } from 'react'
import { Eye } from 'lucide-react'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/utils'
import { usePermissionGate } from '@/lib/usePermissionGate'

const ChangeLog = ({ project }) => {
  const { t } = useTranslation()
  const { allowed: canManageChangeLog, reason: changeLogReason } = usePermissionGate('changeLog.manage')
  const changeRequests = project.change_requests || []
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)

  const getStatusBadge = (status) => {
    const statusColors = {
      SOLICITADA: 'bg-yellow-100 text-yellow-800',
      APROVADA: 'bg-green-100 text-green-800',
      REJEITADA: 'bg-red-100 text-red-800',
      IMPLEMENTADA: 'bg-blue-100 text-blue-800',
    }

    const statusLabels = {
      SOLICITADA: t('change_log.status.requested'),
      APROVADA: t('change_log.status.approved'),
      REJEITADA: t('change_log.status.rejected'),
      EM_ANALISE: t('change_log.status.in_review'),
      IMPLEMENTADA: t('change_log.status.implemented'),
    }

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status] || status}
      </Badge>
    )
  }

  return (
    <div className="p-2">
      <div className="w-full flex justify-between items-center p-4">
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button variant="secondary" disabled={!canManageChangeLog} title={changeLogReason || ''}>{t('change_log.new_request')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-content p-0 border-0">
            <DialogTitle className="sr-only">
              {t('change_log.new_request_title')}
            </DialogTitle>
            <ChangeRequestForm
              project={project}
              stories={project.stories || []}
              onClose={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <ChangeRequestDetails
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              {t('change_log.columns.number')}
            </TableHead>
            <TableHead className="text-center">
              {t('change_log.columns.date')}
            </TableHead>
            <TableHead className="text-center">
              {t('change_log.columns.requester')}
            </TableHead>
            <TableHead className="text-center">
              {t('change_log.columns.description')}
            </TableHead>
            <TableHead className="text-center">
              {t('change_log.columns.status')}
            </TableHead>
            <TableHead className="text-center">
              {t('change_log.columns.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changeRequests.length > 0 ? (
            changeRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="text-center">{request.id}</TableCell>
                <TableCell className="text-center">
                  {formatDate(request.request_date)}
                </TableCell>
                <TableCell className="text-center">
                  {request.requester_name || request.requester?.name || 'N/A'}
                </TableCell>
                <TableCell
                  className="max-w-xs"
                  title={request.description}
                >
                  <p className="truncate">{request.description}</p>
                  {request.stories && request.stories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {request.stories.map((s) => (
                        <Tooltip key={s.id}>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-accent"
                              onClick={() => router.get(route('project.ceremony.show', {
                                project: project.id, ceremony: 'storyDiscovery',
                              }), { artifact: 'stories', scrollTo: s.id })}
                            >
                              {s.type === 'system' ? 'SS' : 'US'}{s.id}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">{s.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(request.status)}
                </TableCell>
                <TableCell className="text-center">
                  <ButtonWithTooltip
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedRequest(request)}
                    tooltipContent={t('change_log.view_details')}
                  >
                    <Eye className="h-4 w-4" />
                  </ButtonWithTooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                {t('change_log.empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default ChangeLog
