import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadGuideProps {
  onImageSelect: (file: File, croppedImage?: string) => void;
  recommendedRatio?: string;
  showPreview?: boolean;
}

export default function ImageUploadGuide({ 
  onImageSelect, 
  recommendedRatio = "4:3", 
  showPreview = true 
}: ImageUploadGuideProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropGuide, setShowCropGuide] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 미리보기 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setShowCropGuide(true);

    // 이미지 크기 확인
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const currentRatio = width / height;
      const recommendedRatioValue = recommendedRatio === "4:3" ? 4/3 : 
                                   recommendedRatio === "16:9" ? 16/9 : 
                                   recommendedRatio === "3:4" ? 0.75 : 1;

      console.log('📷 Image dimensions:', { width, height, currentRatio, recommendedRatioValue });
      
      // 비율이 많이 다르면 경고 표시
      const ratioDiff = Math.abs(currentRatio - recommendedRatioValue);
      if (ratioDiff > 0.3) {
        console.warn('⚠️ 이미지 비율이 권장 비율과 많이 다릅니다.');
      }
    };
    img.src = url;
  };

  const handleConfirmImage = () => {
    if (selectedFile) {
      onImageSelect(selectedFile);
      setShowCropGuide(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowCropGuide(false);
  };

  return (
    <div className="w-full">
      {/* 파일 업로드 버튼 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">이미지 업로드</p>
          <p className="text-sm text-gray-400 mt-1">
            권장 비율: {recommendedRatio} (가로가 더 긴 이미지)
          </p>
        </label>
      </div>

      {/* 미리보기 및 크롭 가이드 */}
      <AnimatePresence>
        {showCropGuide && previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold mb-4">이미지 미리보기</h3>
              
              {/* 게임 화면 미리보기 */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">게임에서 보이는 모습:</p>
                <div className="relative bg-gradient-to-br from-purple-900 to-violet-900 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-4">
                    {/* 미니 게임 카드 1 */}
                    <div className="w-40 h-40 bg-white rounded-lg p-1 shadow-lg">
                      <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-md overflow-hidden aspect-[4/3]">
                        <img 
                          src={previewUrl} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center py-1">
                        <p className="text-xs font-medium line-clamp-1">Your Image</p>
                      </div>
                    </div>

                    {/* VS 아이콘 */}
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">VS</span>
                    </div>

                    {/* 미니 게임 카드 2 */}
                    <div className="w-40 h-40 bg-white rounded-lg p-1 shadow-lg">
                      <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-md overflow-hidden aspect-[4/3] flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">🎨</span>
                      </div>
                      <div className="text-center py-1">
                        <p className="text-xs font-medium line-clamp-1">Opponent</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 원본 이미지 */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">원본 이미지:</p>
                <div className="max-h-64 overflow-hidden rounded-lg border">
                  <img 
                    src={previewUrl} 
                    alt="Original"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-blue-900 mb-1">💡 이미지 팁</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 가로가 더 긴 이미지({recommendedRatio})가 가장 적합합니다</li>
                  <li>• 중요한 부분이 중앙에 있으면 잘리지 않습니다</li>
                  <li>• 인물 사진은 얼굴이 중앙에 오도록 해주세요</li>
                  <li>• 너무 세로가 긴 이미지는 위아래가 잘릴 수 있습니다</li>
                </ul>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmImage}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  이대로 사용하기
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  다시 선택
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}