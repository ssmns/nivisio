import { useEffect, useMemo, useState } from 'react'
import { BarChart3, LineChart, PieChart } from 'lucide-react'
import { ChartView } from './ChartView'
import { Modal } from './Modal'
import { useToast } from './Toast'
import type { ChartConfig, ChartKind } from '../lib/types'
import { useI18n } from '../lib/i18n'

interface ChartModalProps {
  open: boolean
  initial?: ChartConfig | null
  onSave: (config: ChartConfig) => void
  onClose: () => void
}

const COLORS = ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6']
const BACKGROUNDS = [
  { value: '#ffffff', name: 'White' },
  { value: '#fff8fa', name: 'Paper' },
  { value: '#fff1f2', name: 'Blush' },
  { value: '#f8fafc', name: 'Mist' },
  { value: 'transparent', name: 'Transparent' },
]

function parseList(value: string): string[] {
  return value
    .split(/[،,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNumber(value: string): number {
  const normalized = value.replace(/[۰-۹]/g, (digit) =>
    String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)),
  )
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function ChartModal({ open, initial, onSave, onClose }: ChartModalProps) {
  const toast = useToast()
  const { lang, t } = useI18n()
  const [kind, setKind] = useState<ChartKind>('bar')
  const [title, setTitle] = useState('')
  const [labels, setLabels] = useState('')
  const [values, setValues] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [background, setBackground] = useState('#ffffff')

  useEffect(() => {
    if (!open) return
    setKind(initial?.kind ?? 'bar')
    setTitle(initial?.title ?? '')
    setLabels(
      initial
        ? initial.labels.join(lang === 'en' ? ', ' : '، ')
        : lang === 'en'
          ? 'A, B, C, D'
          : 'الف، ب، ج، د',
    )
    setValues(
      initial
        ? initial.values.join(lang === 'en' ? ', ' : '، ')
        : lang === 'en'
          ? '4, 7, 3, 6'
          : '۴، ۷، ۳، ۶',
    )
    setColor(initial?.color ?? COLORS[0])
    setBackground(initial?.background ?? '#ffffff')
  }, [initial, lang, open])

  const config = useMemo<ChartConfig>(() => {
    const parsedLabels = parseList(labels)
    const parsedValues = parseList(values).map(parseNumber)
    const count = Math.max(parsedLabels.length, parsedValues.length)
    return {
      kind,
      title: title.trim(),
      labels: Array.from({ length: count }, (_, index) => parsedLabels[index] || `${index + 1}`),
      values: Array.from({ length: count }, (_, index) => parsedValues[index] ?? 0),
      color,
      background,
    }
  }, [kind, title, labels, values, color, background])

  const save = () => {
    if (config.values.length < 2) {
      toast.show(t('حداقل دو مقدار برای نمودار وارد کنید.', 'Enter at least two chart values.'), { tone: 'error' })
      return
    }
    if (config.values.every((value) => value === 0)) {
      toast.show(t('حداقل یکی از مقدارها باید بزرگ‌تر از صفر باشد.', 'At least one value must be greater than zero.'), { tone: 'error' })
      return
    }
    onSave(config)
  }

  return (
    <Modal
      open={open}
      title={initial ? t('ویرایش نمودار', 'Edit chart') : t('افزودن نمودار', 'Add chart')}
      subtitle={t(
        'نمودار ساده برای یادداشت‌های مطالعاتی؛ بعد از ذخیره روی صفحه قرار می‌گیرد.',
        'A simple study chart; it is placed on the page after saving.',
      )}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('انصراف', 'Cancel')}
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            {initial ? t('ذخیره تغییرات', 'Save changes') : t('انتخاب و جای‌گذاری', 'Pick and place')}
          </button>
        </>
      }
    >
      <div className="chart-modal">
        <div className="chart-modal__form">
          <div className="chart-kinds">
            {(
              [
                { id: 'bar', label: t('میله‌ای', 'Bar'), icon: BarChart3 },
                { id: 'line', label: t('خطی', 'Line'), icon: LineChart },
                { id: 'pie', label: t('دایره‌ای', 'Pie'), icon: PieChart },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={kind === id ? 'is-active' : ''}
                onClick={() => setKind(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <label className="field">
            <span>{t('عنوان نمودار', 'Chart title')}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('مثلاً: ساعت مطالعه هر درس', 'e.g. study hours per subject')}
            />
          </label>
          <label className="field">
            <span>{t('برچسب‌ها', 'Labels')}</span>
            <input value={labels} onChange={(event) => setLabels(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('مقدارها', 'Values')}</span>
            <input
              dir="ltr"
              value={values}
              onChange={(event) => setValues(event.target.value)}
            />
          </label>
          <div className="field">
            <span>{t('رنگ اصلی', 'Main color')}</span>
            <div className="color-row">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`color-dot color-dot--sm${color === item ? ' is-active' : ''}`}
                  style={{ background: item }}
                  onClick={() => setColor(item)}
                  aria-label={t(`رنگ ${item}`, `Color ${item}`)}
                />
              ))}
            </div>
          </div>
          <div className="field">
            <span>{t('پس‌زمینه نمودار', 'Chart background')}</span>
            <div className="color-row">
              {BACKGROUNDS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`color-dot color-dot--sm${
                    background === item.value ? ' is-active' : ''
                  }${item.value === 'transparent' ? ' color-dot--transparent' : ''}`}
                  style={{
                    background:
                      item.value === 'transparent'
                        ? 'repeating-conic-gradient(#ddd 0 25%, #fff 0 50%)'
                        : item.value,
                  }}
                  onClick={() => setBackground(item.value)}
                  title={item.name}
                  aria-label={item.name}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="chart-modal__preview">
          <ChartView config={config} />
        </div>
      </div>
    </Modal>
  )
}
