'use client';

import { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signup, login } from '@/utils/auth';
import { signUpWithSupabase, signInWithSupabase } from '@/utils/supabaseAuth';
import type { SignupData, LoginData, User as UserType } from '@/types/user';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  onSwitchMode: () => void;
}

export default function AuthModal({
  isOpen,
  mode,
  onClose,
  onSuccess,
  onSwitchMode,
}: AuthModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Supabase 회원가입 먼저 시도
        const supabaseResult = await signUpWithSupabase(formData as SignupData);
        if (supabaseResult.success && supabaseResult.user) {
          onSuccess(supabaseResult.user);
          onClose();
          return;
        }
        
        // Supabase 실패시 localStorage fallback
        const localResult = signup(formData as SignupData);
        if (localResult.success && localResult.user) {
          onSuccess(localResult.user);
          onClose();
        } else {
          setError(supabaseResult.error || localResult.error || '회원가입에 실패했습니다.');
        }
      } else {
        // Supabase 로그인 먼저 시도
        console.log('🔐 Attempting Supabase login with:', { email: formData.email });
        const supabaseResult = await signInWithSupabase({
          email: formData.email,
          password: formData.password,
        } as LoginData);
        console.log('🔐 Supabase login result:', supabaseResult);
        if (supabaseResult.success && supabaseResult.user) {
          console.log('✅ Supabase login successful, calling onSuccess');
          onSuccess(supabaseResult.user);
          onClose();
          return;
        }
        
        // Supabase 실패시 localStorage fallback
        const localResult = login({
          email: formData.email,
          password: formData.password,
        } as LoginData);
        if (localResult.success && localResult.user) {
          onSuccess(localResult.user);
          onClose();
        } else {
          setError(supabaseResult.error || localResult.error || '로그인에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(''); // 입력 시 에러 메시지 제거
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSwitchMode = () => {
    resetForm();
    onSwitchMode();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* 모달 내용 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 사용자명 (회원가입시만) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                사용자명
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="사용자명을 입력하세요"
                  required
                  minLength={2}
                  maxLength={20}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                2-20자의 한글, 영문, 숫자, 언더스코어만 사용 가능
              </p>
            </div>
          )}

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
                placeholder="비밀번호를 입력하세요"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="mt-1 text-xs text-gray-500">최소 6자 이상</p>
            )}
          </div>

          {/* 비밀번호 확인 (회원가입시만) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {isLoading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {/* 하단 링크 */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              onClick={handleSwitchMode}
              className="ml-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}