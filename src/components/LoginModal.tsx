import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { Lock, User as UserIcon, Shield, Eye, EyeOff, Coffee } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const res = StorageService.login(username, password);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Login gagal. Periksa username dan kata sandi Anda.');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-[#220407] via-[#3B090F] to-[#180205] text-neutral-100 font-sans text-left">
      <div className="w-full max-w-md space-y-4 my-8">
        {/* Production-Ready Maroon Card */}
        <div className="rounded-2xl border border-rose-900/50 bg-linear-to-b from-[#4A0B13]/95 to-[#2A050A]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Subtle gold/maroon ambient lighting */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Official Brand Logo */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6 relative z-10">
            <div className="w-full flex items-center justify-center py-1">
              <img
                src="./assets/aistudio/logo_mergan_headroom_76c6dae8.png"
                alt="Logo Toko Kopi Mergan"
                className="h-14 w-auto object-contain filter drop-shadow-md brightness-105"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-amber-200/90 uppercase font-mono">
                SISTEM KEUANGAN & OPERASIONAL KASIR
              </h1>
              <p className="text-[11px] text-rose-200/70 mt-0.5">
                Portal Manajemen Multi-Outlet Toko Kopi Mergan
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-700/60 text-xs text-rose-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-rose-100 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>USERNAME (ID PENGGUNA)</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username login..."
                autoComplete="username"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-rose-900/80 bg-[#1D0306]/80 text-white placeholder-rose-300/40 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-100 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>KATA SANDI / PIN</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoComplete="current-password"
                  className="w-full text-xs px-3.5 py-2.5 pr-10 rounded-lg border border-rose-900/80 bg-[#1D0306]/80 text-white placeholder-rose-300/40 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-rose-300/60 hover:text-white cursor-pointer"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all shadow-md cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Coffee className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <span>Masuk ke Sistem Operasional</span>
              )}
            </button>
          </form>

          {/* Institutional Help & Support */}
          <div className="mt-6 pt-4 border-t border-rose-900/40 text-center text-[11px] text-rose-300/70">
            <span>Butuh bantuan akses akun? Hubungi Super Admin Holding di </span>
            <span className="text-amber-300 font-mono">coffeemergan@gmail.com</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-rose-300/60">
          © 2026 Toko Kopi Mergan. Ponorogo Sumbawa · Ponorogo Urip · Madiun Pahlawan.
        </p>
      </div>
    </div>
  );
};
