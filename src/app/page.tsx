// ============================================================
// FILE: src/app/page.tsx
// PURPOSE: Landing Page — الصفحة الرئيسية لـ PS Cafe SaaS
// ============================================================

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" dir="rtl">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between
                      px-6 py-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎮</span>
          <span className="font-bold text-white tracking-tight">PS Cafe</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/30
                           text-purple-300 border border-purple-500/30 font-medium">PRO</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors">
            تسجيل الدخول
          </Link>
          <Link href="/register"
            className="text-sm px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700
                       text-white font-medium transition-all">
            ابدأ مجاناً
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center
                          px-6 pt-24 pb-16 text-center overflow-hidden">

        {/* خلفية grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

        {/* توهج أرجواني */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[400px] rounded-full opacity-10
                        bg-purple-600 blur-[120px] pointer-events-none" />

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full
                        border border-purple-500/30 bg-purple-500/10 text-purple-300
                        text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          نظام إدارة متكامل لكافيهات البلايستيشن
        </div>

        {/* Headline */}
        <h1 className="relative text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6
                       max-w-3xl">
          إدارة كافيهك
          <span className="block text-transparent bg-clip-text
                           bg-gradient-to-l from-purple-400 to-violet-300">
            بدون تعقيد
          </span>
        </h1>

        <p className="relative text-gray-400 text-lg max-w-xl leading-relaxed mb-10">
          تتبع الجلسات، بيع المنتجات، وأدِر موظفيك — كل ده من شاشة واحدة.
          متصمم خصيصاً لكافيهات البلايستيشن في مصر.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-3">
          <Link href="/register"
            className="px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700
                       text-white font-semibold text-sm transition-all
                       shadow-lg shadow-purple-900/40">
            ابدأ تجربتك المجانية ←
          </Link>
          <Link href="/login"
            className="px-8 py-3.5 rounded-xl border border-white/10 bg-white/5
                       hover:bg-white/10 text-white font-medium text-sm transition-all">
            عندي حساب بالفعل
          </Link>
        </div>

        {/* Device Preview Card */}
        <div className="relative mt-20 w-full max-w-2xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1 shadow-2xl
                          shadow-purple-950/50">
            {/* شريط العنوان */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-gray-600 mx-auto">لوحة التحكم</span>
            </div>
            {/* محتوى الـ preview */}
            <div className="p-4 grid grid-cols-3 gap-3">
              {/* device cards */}
              {[
                { name: 'PS5 — 1', status: 'شغّال', time: '01:23:45', color: 'border-yellow-500/30 bg-yellow-500/5' },
                { name: 'PS5 — 2', status: 'شغّال', time: '00:45:12', color: 'border-yellow-500/30 bg-yellow-500/5' },
                { name: 'PS4 — 1', status: 'متاح',  time: '—',        color: 'border-green-500/30  bg-green-500/5'  },
                { name: 'PS5 — 3', status: 'شغّال', time: '02:10:03', color: 'border-yellow-500/30 bg-yellow-500/5' },
                { name: 'PS4 — 2', status: 'متاح',  time: '—',        color: 'border-green-500/30  bg-green-500/5'  },
                { name: 'PS5 — 4', status: 'شغّال', time: '00:08:55', color: 'border-yellow-500/30 bg-yellow-500/5' },
              ].map((d, i) => (
                <div key={i} className={`rounded-xl border p-3 ${d.color}`}>
                  <p className="text-xs font-medium text-white mb-1">{d.name}</p>
                  <p className={`text-[10px] font-mono font-bold
                    ${d.status === 'شغّال' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {d.time}
                  </p>
                  <p className="text-[9px] text-gray-500 mt-1">{d.status}</p>
                </div>
              ))}
            </div>
            {/* شريط سفلي */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <span className="text-[10px] text-gray-600">4 أجهزة شغّالة</span>
              <span className="text-[10px] text-purple-400 font-medium">إيرادات اليوم: 320 ج</span>
            </div>
          </div>
          {/* ظل تحت الـ card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2
                          w-3/4 h-8 bg-purple-600/20 blur-xl rounded-full" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium mb-3">كل اللي محتاجه</p>
          <h2 className="text-3xl font-bold text-white">مصمم للكافيهات المصرية</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: '⏱',
              title: 'جلسات فورية',
              desc: 'ابدأ وأوقف الجلسات بضغطة واحدة. الحساب التلقائي للوقت والسعر.',
            },
            {
              icon: '🛒',
              title: 'نقطة بيع متكاملة',
              desc: 'بيع المأكولات والمشروبات وضمّها لفاتورة الجلسة أو بشكل منفصل.',
            },
            {
              icon: '📦',
              title: 'إدارة المخزون',
              desc: 'تتبع الكميات تلقائياً. تنبيه عند قرب النفاد.',
            },
            {
              icon: '👥',
              title: 'إدارة الموظفين',
              desc: 'صلاحيات مختلفة للمالك والمدير والكاشير. كل واحد يشوف بس اللي يخصه.',
            },
            {
              icon: '📊',
              title: 'تقارير يومية',
              desc: 'إيرادات الجلسات والمبيعات في تقرير واضح كل يوم.',
            },
            {
              icon: '⚡',
              title: 'تحديث فوري',
              desc: 'الشاشة بتتحدث لحظة بلحظة لما يحصل أي تغيير على أي جهاز.',
            },
          ].map((f, i) => (
            <div key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02]
                         p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium mb-3">الأسعار</p>
          <h2 className="text-3xl font-bold text-white">بسيط وواضح</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: 'Normal',
              price: 'مجاناً',
              period: '',
              features: ['10 أجهزة', '5 موظفين', 'تقارير أساسية', 'POS كامل'],
              cta: 'ابدأ مجاناً',
              highlight: false,
            },
            {
              name: 'Pro 💜',
              price: '199 ج',
              period: '/ شهر',
              features: ['25 جهاز', '15 موظف', 'تقارير متقدمة', 'تصدير البيانات'],
              cta: 'اشترك في Pro',
              highlight: true,
            },
            {
              name: 'Enterprise ⭐',
              price: 'تواصل معنا',
              period: '',
              features: ['أجهزة غير محدودة', 'موظفين غير محدودين', 'دعم مخصص', 'سلاسل الكافيهات'],
              cta: 'تواصل معنا',
              highlight: false,
            },
          ].map((plan, i) => (
            <div key={i} className={`relative rounded-2xl border p-6 transition-all
              ${plan.highlight
                ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-950/50'
                : 'border-white/5 bg-white/[0.02]'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2
                                text-[10px] px-3 py-1 rounded-full
                                bg-purple-600 text-white font-medium">
                  الأكثر شيوعاً
                </div>
              )}
              <h3 className={`font-bold mb-1 ${plan.highlight ? 'text-purple-300' : 'text-white'}`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-purple-400 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className={`block w-full py-2.5 rounded-xl text-sm font-medium text-center transition-all
                  ${plan.highlight
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center">
        <div className="relative max-w-2xl mx-auto rounded-3xl border border-purple-500/20
                        bg-purple-500/5 p-12 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #7c3aed 0%, transparent 70%)`,
            }} />
          <h2 className="relative text-3xl font-bold text-white mb-4">
            جاهز تبدأ؟
          </h2>
          <p className="relative text-gray-400 mb-8 leading-relaxed">
            انضم لكافيهات بتستخدم PS Cafe وفر وقتك على إدارة الجلسات.
          </p>
          <Link href="/register"
            className="inline-block px-10 py-4 rounded-xl bg-purple-600 hover:bg-purple-700
                       text-white font-semibold text-sm transition-all
                       shadow-lg shadow-purple-900/50">
            سجّل كافيهك دلوقتي ←
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <span className="font-bold text-white text-sm">PS Cafe</span>
          </div>
          <p className="text-xs text-gray-600">
            © 2026 PS Cafe — نظام إدارة كافيهات البلايستيشن
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login"    className="text-xs text-gray-600 hover:text-gray-400 transition-colors">دخول</Link>
            <Link href="/register" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">تسجيل</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}
