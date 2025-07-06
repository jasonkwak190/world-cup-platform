'use client';

import { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signup } from '@/utils/auth';
import { signUpWithSupabase, signInWithSupabase, sendPasswordResetOTP, resetPasswordWithOTP } from '@/utils/supabaseAuth';
import type { SignupData, User as UserType } from '@/types/user';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Supabase 회원가입 먼저 시도
        const supabaseResult = await signUpWithSupabase({
          email: formData.email,
          password: formData.password,
          username: formData.username
        });
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
        // Supabase 로그인 시도 (타임아웃 추가)
        console.log('🔐 Attempting Supabase login with:', { email: formData.email });
        
        try {
          // 타임아웃 설정 (30초)
          console.log('⏰ Starting login with 30s timeout...');
          
          let timeoutId: NodeJS.Timeout;
          
          const loginPromise = signInWithSupabase({
            email: formData.email,
            password: formData.password,
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              console.error('⏰ Login timeout after 30 seconds!');
              reject(new Error('로그인 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'));
            }, 30000);
          });
          
          const supabaseResult = await Promise.race([loginPromise, timeoutPromise]);
          
          // 성공하면 타임아웃 취소
          clearTimeout(timeoutId);
          
          console.log('🔐 Supabase login result:', supabaseResult);
          
          if ((supabaseResult as any).success && (supabaseResult as any).user) {
            console.log('✅ Supabase login successful, calling onSuccess');
            onSuccess((supabaseResult as any).user);
            onClose();
            return;
          } else {
            console.log('❌ Supabase login failed:', (supabaseResult as any).error);
            setError((supabaseResult as any).error || '로그인에 실패했습니다.');
          }
        } catch (timeoutError) {
          console.error('❌ Login timeout or error:', timeoutError);
          
          // 타임아웃인 경우 에러 메시지만 표시
          if (timeoutError.message.includes('초과')) {
            setError('로그인 처리가 지연되고 있습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
          } else {
            setError(timeoutError.message || '로그인 중 오류가 발생했습니다.');
          }
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

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResetMessage('');

    try {
      const result = await sendPasswordResetOTP(formData.email);
      if (result.success) {
        setResetMessage(result.message || '인증번호가 이메일로 발송되었습니다.');
        setResetStep('otp');
        setShowForgotPassword(true);
      } else {
        setError(result.error || '인증번호 발송에 실패했습니다.');
      }
    } catch {
      setError('인증번호 발송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTPAndResetPassword = async () => {
    if (!otpCode) {
      setError('인증번호를 입력해주세요.');
      return;
    }
    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await resetPasswordWithOTP(formData.email, otpCode, newPassword);
      if (result.success) {
        setResetMessage(result.message || '비밀번호가 성공적으로 변경되었습니다.');
        setShowForgotPassword(false);
        setResetStep('email');
        // 폼 초기화
        setOtpCode('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(result.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
    setResetMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForgotPassword(false);
    setResetStep('email');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
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

          {/* 성공 메시지 */}
          {resetMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{resetMessage}</p>
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

          {/* 비밀번호 찾기 (로그인 모드에서만) */}
          {mode === 'login' && !showForgotPassword && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading || !formData.email}
                className="text-sm text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 transition-colors"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}

          {/* 인증번호 입력 및 새 비밀번호 설정 */}
          {showForgotPassword && resetStep === 'otp' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">비밀번호 재설정</h3>
              
              {/* 인증번호 입력 */}
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-1">
                  인증번호 (이메일 확인)
                </label>
                <input
                  type="text"
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="6자리 인증번호를 입력하세요"
                  maxLength={6}
                />
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="새 비밀번호 (6자 이상)"
                  minLength={6}
                />
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              {/* 비밀번호 변경 버튼 */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleVerifyOTPAndResetPassword}
                  disabled={isLoading || !otpCode || !newPassword || !confirmNewPassword}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {isLoading ? '처리 중...' : '비밀번호 변경'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStep('email');
                    setOtpCode('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
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