'use client'
// ============================================================
// FILE: src/app/dashboard/devices/components/AddDeviceModal.tsx
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { addDevice } from '@/app/dashboard/actions/devices'

const DEVICE_TYPES = [
  { value: 'PS5', label: 'PlayStation 5', icon: '🎮' },
  { value: 'PS4', label: 'PlayStation 4', icon: '🎮' },
  { value: 'PC',  label: 'PC Gaming',   icon: '💻' },
  { value: 'VR', label: 'VR Headset', icon: '🥽' },
  { value:'Ping', label:' Ping Pong ', icon:' 🏓' },
]

export default function AddDeviceModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // حالات الـ Custom Select
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedType) {
      setError('من فضلك اختر نوع الجهاز')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    formData.append('type', selectedType) // إضافة النوع المختار يدوياً

    const result = await addDevice(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setIsOpen(false)
      setLoading(false)
      setSelectedType('')
      ;(event.target as HTMLFormElement).reset()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500
                   text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <span className="text-base">+</span>
        إضافة جهاز
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4
                     bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6
                          w-full max-w-md shadow-2xl shadow-purple-500/5">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white">إضافة جهاز جديد</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400
                              rounded-lg px-3 py-2 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
              {/* اسم الجهاز */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 mr-1 uppercase tracking-wider">اسم الجهاز</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="مثال: PS5 - غرفة 1"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3
                             text-white text-sm placeholder-gray-600
                             focus:outline-none focus:border-purple-500 hover:bg-white/[0.05] transition-all"
                />
              </div>

              {/* Custom Select - نوع الجهاز */}
              <div className="space-y-1.5" ref={selectRef}>
                <label className="text-[11px] font-medium text-gray-400 mr-1 uppercase tracking-wider">نوع الجهاز</label>
                <div className="relative">
                  {/* الحقل الأساسي */}
                  <div
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3
                               text-white text-sm cursor-pointer transition-all flex items-center justify-between
                               ${isSelectOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10 hover:bg-white/[0.05]'}`}
                  >
                    <span className={selectedType ? 'text-white' : 'text-gray-600'}>
                      {selectedType ? DEVICE_TYPES.find(t => t.value === selectedType)?.label : 'اختر النوع'}
                    </span>
                    <span className={`text-[10px] transition-transform duration-200 ${isSelectOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>

                  {/* القائمة الطايرة (The Dropdown) */}
                  {isSelectOpen && (
                    <ul className="absolute z-[60] w-full mt-2 bg-[#161625] border border-white/10 
                                   rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                      {DEVICE_TYPES.map((type) => (
                        <li
                          key={type.value}
                          onClick={() => {
                            setSelectedType(type.value)
                            setIsSelectOpen(false)
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 
                                     hover:bg-purple-600 hover:text-white cursor-pointer transition-colors"
                        >
                          <span>{type.icon}</span>
                          {type.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* سعر الساعة */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 mr-1 uppercase tracking-wider">سعر الساعة (جنيه)</label>
                <div className="relative">
                   <input
                    name="hourly_rate"
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    placeholder="50"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3
                               text-white text-sm placeholder-gray-600 pl-12
                               focus:outline-none focus:border-purple-500 hover:bg-white/[0.05] transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">EGP</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400
                             hover:bg-white/5 hover:text-white transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 
                             hover:from-purple-500 hover:to-indigo-500
                             disabled:from-purple-900 disabled:to-indigo-900
                             text-white text-sm font-bold py-3 rounded-xl 
                             shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
                >
                  {loading ? '...' : 'إضافة الجهاز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}