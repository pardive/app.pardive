'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function LoginForm() {
  const [useOtp, setUseOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    identifier: '',
    password: '',
    otp: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 🚫 OTP not implemented yet
    if (useOtp) {
      setError('OTP login coming soon');
      return;
    }

    if (!form.identifier || !form.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      const { error } = await supabase.auth.signInWithPassword({
        email: form.identifier,
        password: form.password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      /* ======================================================
         ✅ LOGIN SUCCESS REDIRECT (UNCHANGED BEHAVIOR)
      ====================================================== */
      const lastApp = localStorage.getItem('last_app');

      if (!lastApp || lastApp === 'workspace') {
        window.location.href = '/workspace';
      } else {
        window.location.href = `/apps/${lastApp}`;
      }
      /* ====================================================== */

    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#00332D]">
      <p className="text-lg text-center text-gray-500">
        Log in to your account
      </p>

      {/* Email or Mobile */}
      <input
        name="identifier"
        type="text"
        placeholder="Email or Mobile"
        value={form.identifier}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-md bg-transparent border border-[#14532d] text-black placeholder-gray-400 focus:outline-none"
      />

      {/* Password or OTP */}
      {!useOtp ? (
        <div className="space-y-2">
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-md bg-transparent border border-[#14532d] text-black placeholder-gray-400 focus:outline-none"
          />
          <div className="text-right -mt-1">
            <button
              type="button"
              onClick={() => setUseOtp(true)}
              className="text-[#3B82F6] text-xs underline leading-none"
            >
              Login using OTP instead
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            name="otp"
            type="text"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-md bg-transparent border border-[#14532d] text-black placeholder-gray-400 focus:outline-none"
          />
          <div className="text-right -mt-1">
            <button
              type="button"
              onClick={() => setUseOtp(false)}
              className="text-[#3B82F6] text-xs underline leading-none"
            >
              Use password instead
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="-mt-2">
        <button
          type="submit"
          disabled={loading}
          className="
            inline-flex w-full h-11 items-center justify-center
            rounded-md border
            bg-ui-buttonPrimaryBg text-ui-buttonPrimaryText border-ui-buttonPrimaryBorder
            hover:bg-ui-buttonPrimaryHover
            focus:outline-none focus:ring-2 focus:ring-ui-buttonPrimaryBorder
            disabled:opacity-60
          "
        >
          <span className="font-semibold leading-none">
            {loading ? 'Logging in…' : 'Login'}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="px-2 text-sm text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Third-party login (UI only) */}
      <div className="space-y-2">
        {[
          { name: 'Google', icon: '/icons/google.png' },
          { name: 'Microsoft', icon: '/icons/microsoft.png' },
          { name: 'LinkedIn', icon: '/icons/linkedin.png' },
        ].map((provider) => (
          <button
            key={provider.name}
            type="button"
            onClick={() => alert(`${provider.name} login coming soon`)}
            className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition"
          >
            <Image
              src={provider.icon}
              alt={provider.name}
              width={20}
              height={20}
              className="mr-2"
            />
            Login with {provider.name}
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-sm mt-6 text-[#00380e]">
        Don’t have an account?{' '}
        <Link href="/auth/register" className="underline">
          Register
        </Link>
      </p>
    </form>
  );
}
