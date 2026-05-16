'use client';

import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

export default function MobileWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => setShow(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
          <Monitor className="h-7 w-7 text-indigo-600" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Desktop Only</h2>
        <p className="text-sm text-gray-500">
          Goalaris is designed for desktop use. Please open it on your laptop or computer.
        </p>
      </div>
    </div>
  );
}
