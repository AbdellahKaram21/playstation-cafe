'use client'
// ============================================================
// FILE: src/app/dashboard/devices/components/EditDeviceModal.tsx
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { updateDevice, deleteDevice } from '../../actions/devices'
import type { Device } from '@/types/database.types'

type Props = {
  device: Device
}

// مصفوفة الأنواع مع الأيقونات (نفس اللي في صورة الإضافة)
const deviceTypes = [
  { value: 'PS5',  label: 'PlayStation 5', icon: '🎮' },
  { value: 'PS4',  label: 'PlayStation 4', icon: '🕹️' },
  { value: 'PC',   label: 'PC Gaming',      icon: '💻' },
  { value: 'VR',   label: 'VR Headset',    icon: '🥽' },
  { value: 'Ping', label: 'Ping Pong',     icon: '🏓' },
]

export default function EditDeviceModal({ device }: Props) {
  const [isOpen, setIsOpen]               = useState(false)
  const [isSelectOpen, setIsSelectOpen]   = useState(false) // حالة فتح قائمة النوع
  const [selectedType, setSelectedType]   = useState(device.type) // النوع المختار حالياً
  const [loading, setLoading]             = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [error, setError]                 = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  
  const selectRef = useRef<HTMLDivElement>(null)

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentTypeInfo = deviceTypes.find(t => t.value === selectedType)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData   = new FormData(event.currentTarget)
    const name       = formData.get('name') as string
    const hourlyRate = parseFloat(formData.get('hourly_rate') as string)

    if (!name || !selectedType || isNaN(hourlyRate) || hourlyRate <= 0) {
      setError('من فضلك اكمل جميع الحقول بشكل صحيح')
      setLoading(false)
      return
    }

    const result = await updateDevice(device.id, {
      name,
      type:        selectedType as Device['type'],
      hourly_rate: hourlyRate,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setIsOpen(false)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    const result = await deleteDevice(device.id)
    if (result.error) {
      setError(result.error)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setConfirmDelete(false); setError(''); setSelectedType(device.type) }}
        className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
        title="تعديل الجهاز"
      >
        ✏️
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white">تعديل الجهاز</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors text-xl">×</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-2 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
              
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 mr-1">اسم الجهاز</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={device.name}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Custom Select */}
              <div className="relative" ref={selectRef}>
                <label className="block text-xs text-gray-400 mb-1.5 mr-1">نوع الجهاز</label>
                <div 
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm cursor-pointer transition-all flex items-center justify-between
                    ${isSelectOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10'}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{currentTypeInfo?.icon}</span>
                    <span>{currentTypeInfo?.label}</span>
                  </div>
                  <span className={`text-[10px] transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}>▲</span>
                </div>

                {isSelectOpen && (
                  <div className="absolute left-0 right-0 z-[60] mt-2 bg-[#161625] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {deviceTypes.map((t) => (
                      <div
                        key={t.value}
                        onClick={() => { setSelectedType(t.value); setIsSelectOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-purple-600 hover:text-white cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <span>{t.icon}</span> {t.label}
                        </span>
                        {selectedType === t.value && <span className="text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 mr-1">سعر الساعة (جنيه)</label>
                <input
                  name="hourly_rate"
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  defaultValue={device.hourly_rate}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium py-3 rounded-xl transition-colors"
                >إلغاء</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-sm font-medium py-3 rounded-xl transition-colors"
                >{loading ? '...' : 'حفظ التعديلات'}</button>
              </div>

            </form>

            {device.status !== 'in_use' && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`w-full text-sm font-medium py-3 rounded-xl transition-all ${confirmDelete ? 'bg-red-600 text-white' : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'}`}
                >
                  {deleting ? '...' : confirmDelete ? '⚠️ تأكيد الحذف — اضغط مرة ثانية' : '🗑 حذف الجهاز'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}