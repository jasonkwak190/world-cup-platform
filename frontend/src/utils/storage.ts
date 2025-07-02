// LocalStorage utility functions for WorldCup data

export interface StoredWorldCup {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string; // Base64 또는 URL
  author: string;
  createdAt: string;
  participants: number;
  comments: number;
  likes: number;
  items: StoredWorldCupItem[];
  isPublic: boolean;
}

export interface StoredWorldCupItem {
  id: string;
  title: string;
  image: string; // Base64 또는 URL
  description?: string;
}

// File을 Base64로 변환
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log('fileToBase64 success:', {
          fileName: file.name,
          fileSize: file.size,
          resultLength: result.length,
          resultPreview: result.substring(0, 50) + '...'
        });
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error('fileToBase64 error:', error);
        reject(error);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('fileToBase64 exception:', error);
      reject(error);
    }
  });
};

// WorldCup 데이터를 저장 형식으로 변환
export const convertToStoredFormat = async (worldCupData: any): Promise<StoredWorldCup> => {
  const id = Date.now().toString();
  
  // 썸네일 처리 - 썸네일이 없으면 빈 문자열로 설정 (WorldCupCard에서 플레이스홀더 표시)
  let thumbnailUrl = '';
  if (worldCupData.thumbnail) {
    console.log('Processing thumbnail:', typeof worldCupData.thumbnail, worldCupData.thumbnail);
    if (typeof worldCupData.thumbnail === 'string') {
      thumbnailUrl = worldCupData.thumbnail;
    } else if (worldCupData.thumbnail instanceof File) {
      console.log('Converting File thumbnail to base64');
      thumbnailUrl = await fileToBase64(worldCupData.thumbnail);
    } else if (worldCupData.thumbnail instanceof Blob) {
      console.log('Converting Blob thumbnail to base64');
      // Blob을 File로 변환한 후 base64 변환
      const file = new File([worldCupData.thumbnail], 'thumbnail.jpg', { type: 'image/jpeg' });
      thumbnailUrl = await fileToBase64(file);
    }
    console.log('Final thumbnail URL length:', thumbnailUrl.length);
  }
  // thumbnailUrl이 빈 문자열이면 WorldCupCard에서 자동으로 플레이스홀더 표시
  
  // 아이템들 처리
  const items: StoredWorldCupItem[] = await Promise.all(
    worldCupData.items.map(async (item: any) => {
      let imageUrl = '';
      if (typeof item.image === 'string') {
        imageUrl = item.image;
      } else if (item.image instanceof File) {
        imageUrl = await fileToBase64(item.image);
      } else if (item.image instanceof Blob) {
        // Blob을 File로 변환한 후 base64 변환
        const file = new File([item.image], `item_${item.id}.jpg`, { type: 'image/jpeg' });
        imageUrl = await fileToBase64(file);
      }
      
      return {
        id: item.id,
        title: item.title,
        image: imageUrl,
        description: item.description,
      };
    })
  );
  
  return {
    id,
    title: worldCupData.title,
    description: worldCupData.description,
    category: worldCupData.category,
    thumbnail: thumbnailUrl,
    author: '익명', // 추후 사용자 시스템 구현 시 변경
    createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
    participants: 0,
    comments: 0,
    likes: 0,
    items,
    isPublic: worldCupData.isPublic,
  };
};

// LocalStorage에 월드컵 저장
export const saveWorldCup = async (worldCupData: any): Promise<void> => {
  try {
    const stored = await convertToStoredFormat(worldCupData);
    const existing = getStoredWorldCups();
    const updated = [stored, ...existing];
    
    localStorage.setItem('worldcups', JSON.stringify(updated));
    console.log('WorldCup saved successfully:', stored);
  } catch (error) {
    console.error('Error saving worldcup:', error);
    throw new Error('월드컵 저장 중 오류가 발생했습니다.');
  }
};

// LocalStorage에서 월드컵 목록 가져오기
export const getStoredWorldCups = (): StoredWorldCup[] => {
  try {
    const stored = localStorage.getItem('worldcups');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading worldcups:', error);
    return [];
  }
};

// 특정 월드컵 가져오기
export const getWorldCupById = (id: string): StoredWorldCup | null => {
  const worldcups = getStoredWorldCups();
  return worldcups.find(wc => wc.id === id) || null;
};

// 월드컵 삭제
export const deleteWorldCup = (id: string): void => {
  const existing = getStoredWorldCups();
  const filtered = existing.filter(wc => wc.id !== id);
  localStorage.setItem('worldcups', JSON.stringify(filtered));
};

// 월드컵 업데이트 (좋아요, 참여자 수 등)
export const updateWorldCupStats = (id: string, updates: Partial<Pick<StoredWorldCup, 'participants' | 'likes' | 'comments'>>): void => {
  const existing = getStoredWorldCups();
  const updated = existing.map(wc => 
    wc.id === id ? { ...wc, ...updates } : wc
  );
  localStorage.setItem('worldcups', JSON.stringify(updated));
};