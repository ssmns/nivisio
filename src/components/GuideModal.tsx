import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'
import { GUIDE_KINDS, type GuideKind } from '../lib/types'

interface GuideModalProps {
  open: boolean
  onSave: (kind: GuideKind) => void
  onClose: () => void
}

export function GuideModal({ open, onSave, onClose }: GuideModalProps) {
  const { lang, t } = useI18n()
  return (
    <Modal
      open={open}
      title={t('ابزار اندازه‌گیری', 'Measuring guides')}
      subtitle={t('یک ابزار انتخاب کنید و روی صفحه بگذارید؛ بعداً قابل جابه‌جایی و چرخش است.', 'Choose a guide and place it on the page; it can be moved and rotated.')}
      onClose={onClose}
    >
      <div className="guide-picker">
        {GUIDE_KINDS.map((item) => (
          <button key={item.id} type="button" onClick={() => onSave(item.id)}>
            <span className={`guide-icon guide-icon--${item.id}`} />
            <strong>{lang === 'en' ? item.nameEn : item.name}</strong>
          </button>
        ))}
      </div>
    </Modal>
  )
}
