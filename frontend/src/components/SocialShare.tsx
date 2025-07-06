'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Download, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';
import { WorldCupItem } from '@/types/game';

interface SocialShareProps {
  worldcupId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  winner?: WorldCupItem;
  participants?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareOption {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  url: (shareUrl: string, text: string) => string;
}

const shareOptions: ShareOption[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    url: (shareUrl, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    url: (shareUrl, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  },
  {
    id: 'kakao',
    name: 'KakaoTalk',
    icon: MessageCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    url: (shareUrl, text) => `https://sharer.kakao.com/talk/friends/?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`
  }
];

export default function SocialShare({
  worldcupId,
  title,
  description,
  thumbnail,
  winner,
  participants = 0,
  isOpen,
  onClose
}: SocialShareProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/play/${worldcupId}`;
  const shareText = winner 
    ? `${title}에서 ${winner.title}이(가) 우승했습니다! 🏆 당신의 선택은?`
    : `${title} - 이상형 월드컵에 참여해보세요! 🏆`;

  // Generate custom OG image
  const generateOGImage = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not available'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size for OG image (1200x630)
      canvas.width = 1200;
      canvas.height = 630;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#059669');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);

      // Add pattern/texture
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 1200, Math.random() * 630, Math.random() * 30, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      // Handle long titles
      const maxWidth = 1000;
      let fontSize = 64;
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      
      while (ctx.measureText(title).width > maxWidth && fontSize > 32) {
        fontSize -= 4;
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      }
      
      // Draw title with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillText(title, 600, 200);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Winner info if available
      if (winner) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 48px Inter, system-ui, sans-serif';
        ctx.fillText('🏆 우승자', 600, 280);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 56px Inter, system-ui, sans-serif';
        ctx.fillText(winner.title, 600, 350);
      }

      // Stats
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '32px Inter, system-ui, sans-serif';
      const statsText = `${participants.toLocaleString()}명이 참여한 월드컵`;
      ctx.fillText(statsText, 600, winner ? 420 : 320);

      // Call to action
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter, system-ui, sans-serif';
      const ctaText = '당신의 선택은? 지금 참여해보세요!';
      ctx.fillText(ctaText, 600, winner ? 500 : 400);

      // Logo/branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('WorldCup Platform', 1150, 580);

      // Trophy icon
      ctx.fillStyle = '#fbbf24';
      ctx.font = '80px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🏆', 50, 150);

      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to generate image'));
        }
      }, 'image/png', 1);
    });
  }, [title, winner, participants]);

  // Handle image generation
  const handleGenerateImage = useCallback(async () => {
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateOGImage();
      setGeneratedImageUrl(imageUrl);
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [generateOGImage]);

  // Copy to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [shareUrl]);

  // Download generated image
  const handleDownloadImage = useCallback(() => {
    if (!generatedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_worldcup.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImageUrl, title]);

  // Share via Web Share API or fallback
  const handleShare = useCallback(async (option: ShareOption) => {
    const url = option.url(shareUrl, shareText);
    
    // Try Web Share API first (mobile)
    if (navigator.share && option.id === 'native') {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        console.log('Web Share API failed, falling back to URL');
      }
    }
    
    // Fallback to opening URL
    window.open(url, '_blank', 'width=600,height=400');
  }, [shareUrl, shareText, title]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">공유하기</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              {description && (
                <p className="text-gray-600 text-sm mb-2">{description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{participants.toLocaleString()}명 참여</span>
                {winner && (
                  <>
                    <span>•</span>
                    <span>🏆 {winner.title} 우승</span>
                  </>
                )}
              </div>
            </div>

            {/* Link Sharing */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">링크 복사</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copyStatus === 'copied'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copyStatus === 'copied' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">소셜 미디어</h3>
              <div className="grid grid-cols-3 gap-3">
                {shareOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleShare(option)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${option.bgColor}`}
                    >
                      <Icon className={`w-6 h-6 ${option.color}`} />
                      <span className="text-sm font-medium text-gray-700">
                        {option.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Image Generation */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">맞춤 이미지 생성</h3>
              <div className="border rounded-lg p-4">
                {!generatedImageUrl ? (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-4">
                      공유용 맞춤 이미지를 생성하세요
                    </p>
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      {isGeneratingImage ? '생성 중...' : '이미지 생성'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <img
                      src={generatedImageUrl}
                      alt="Generated share image"
                      className="w-full rounded border"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadImage}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        다운로드
                      </button>
                      <button
                        onClick={handleGenerateImage}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        재생성
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden canvas for image generation */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}