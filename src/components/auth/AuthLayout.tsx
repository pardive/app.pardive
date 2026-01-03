'use client';

import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-ui-appBgLight flex items-center justify-center px-4">
      {/* Card centered both axes; fixed width, responsive height */}
      <div className="w-[92vw] max-w-[92vw] sm:w-[420px] sm:max-w-[420px] px-7 py-6 rounded-md bg-white text-[#00332D] shadow-2xl">
        {/* Logo + divider */}
        <div className="flex items-center justify-center">
          <Image src="/logo/logo-green.svg" alt="Saltify Logo" width={160} height={40} priority />
        </div>
        <div className="w-full h-px bg-gray-200 my-4" />

        {/* Field block (compact & consistent) */}
        <div
          className="
            mx-auto w-full
            max-w-[300px] sm:max-w-[320px] md:max-w-[340px]
            px-2 sm:px-3
            flex flex-col gap-3
            text-[14px]
            [&_label]:text-[13px] [&_label]:mb-1
            [&_input]:h-9 [&_input]:px-3 [&_input]:text-[14px] [&_input]:w-full
            [&_select]:h-9 [&_select]:px-3 [&_select]:text-[14px] [&_select]:w-full
            [&_textarea]:text-[14px] [&_textarea]:p-3 [&_textarea]:w-full
            [&_button]:h-9 [&_button]:w-full
          "
        >
          {children}
        </div>
      </div>
    </main>
  );
}
