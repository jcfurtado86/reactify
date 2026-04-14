import { toast } from 'sonner'
import i18n from '@/i18n'

const extractServerMessage = (error) => {
  if (!error) return null
  if (typeof error === 'string') return error
  if (error?.response?.data?.message) return error.response.data.message
  if (typeof error?.response?.data === 'string') return error.response.data
  if (error?.message && !error.response) return error.message
  if (typeof error === 'object' && !error.response) {
    const first = Object.values(error).find(
      (v) => typeof v === 'string' && v.length > 0,
    )
    if (first) return first
  }
  return null
}

export const toastApiError = (
  error,
  fallbackKey = 'common.toast.error_generic',
) => {
  const serverMsg = extractServerMessage(error)
  toast.error(serverMsg || i18n.t(fallbackKey))
}

export const toastSuccess = (key, params) =>
  toast.success(i18n.t(key, params))

export const toastInfo = (key, params) => toast.info(i18n.t(key, params))

export const toastWarning = (key, params) =>
  toast.warning(i18n.t(key, params))

export const toastError = (key, params) => toast.error(i18n.t(key, params))
