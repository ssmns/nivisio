import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { translate } from '../lib/lang'

type Tone = 'info' | 'error' | 'success'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  message: string
  tone: Tone
  action?: ToastAction
}

interface ToastApi {
  show: (message: string, options?: { tone?: Tone; action?: ToastAction; duration?: number }) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef<number[]>([])

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const show = useCallback<ToastApi['show']>(
    (message, options) => {
      const id = ++counter.current
      const item: ToastItem = {
        id,
        message,
        tone: options?.tone ?? 'info',
        action: options?.action,
      }
      setItems((current) => [...current.slice(-2), item])
      const timer = window.setTimeout(() => remove(id), options?.duration ?? 4600)
      timers.current.push(timer)
    },
    [remove],
  )

  useEffect(() => {
    return () => timers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((item) => {
          const Icon = item.tone === 'error' ? AlertCircle : item.tone === 'success' ? CheckCircle2 : Info
          return (
            <div key={item.id} className={`toast toast--${item.tone}`}>
              <Icon size={18} className="toast__icon" />
              <p>{item.message}</p>
              {item.action && (
                <button
                  type="button"
                  className="toast__action"
                  onClick={() => {
                    item.action?.onClick()
                    remove(item.id)
                  }}
                >
                  {item.action.label}
                </button>
              )}
              <button
                type="button"
                className="toast__close"
                aria-label={translate('بستن', 'Close')}
                onClick={() => remove(item.id)}
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside ToastProvider')
  return api
}
