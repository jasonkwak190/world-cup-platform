/**
 * 공통 API 상태 관리 훅
 * 로딩, 에러, 데이터 상태를 일관되게 관리
 */

import { useState, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface ApiStateActions<T> {
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
  executeAsync: <R = T>(
    asyncFunction: () => Promise<R>,
    options?: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
      transformData?: (data: R) => T;
    }
  ) => Promise<R | null>;
}

export type UseApiStateReturn<T> = ApiState<T> & ApiStateActions<T>;

/**
 * API 상태 관리를 위한 범용 훅
 */
export function useApiState<T = any>(initialData: T | null = null): UseApiStateReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, [initialData]);

  const executeAsync = useCallback(async <R = T>(
    asyncFunction: () => Promise<R>,
    options: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
      transformData?: (data: R) => T;
    } = {}
  ): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await asyncFunction();
      
      // 데이터 변환이 필요한 경우
      const transformedData = options.transformData 
        ? options.transformData(result)
        : result as unknown as T;
      
      setData(transformedData);
      setSuccess(true);
      options.onSuccess?.(result);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
      setSuccess(false);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    success,
    setData,
    setLoading,
    setError,
    setSuccess,
    reset,
    executeAsync,
  };
}

/**
 * 댓글 목록을 위한 특화된 API 상태 훅
 */
export function useCommentListState() {
  const apiState = useApiState<any[]>([]);
  
  const addComment = useCallback((newComment: any) => {
    apiState.setData(prev => prev ? [newComment, ...prev] : [newComment]);
  }, [apiState]);
  
  const updateComment = useCallback((commentId: string | number, updatedComment: any) => {
    apiState.setData(prev => 
      prev ? prev.map(comment => 
        comment.id === commentId ? { ...comment, ...updatedComment } : comment
      ) : null
    );
  }, [apiState]);
  
  const removeComment = useCallback((commentId: string | number) => {
    apiState.setData(prev => 
      prev ? prev.filter(comment => comment.id !== commentId) : null
    );
  }, [apiState]);
  
  const toggleCommentLike = useCallback((commentId: string | number, liked: boolean, likeCount: number) => {
    apiState.setData(prev => 
      prev ? prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, isLiked: liked, likes: likeCount } 
          : comment
      ) : null
    );
  }, [apiState]);

  return {
    ...apiState,
    addComment,
    updateComment,
    removeComment,
    toggleCommentLike,
  };
}

/**
 * 단일 리소스를 위한 API 상태 훅
 */
export function useSingleResourceState<T>() {
  const apiState = useApiState<T>();
  
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    apiState.setData(prev => prev ? { ...prev, [field]: value } : null);
  }, [apiState]);
  
  const updateFields = useCallback((updates: Partial<T>) => {
    apiState.setData(prev => prev ? { ...prev, ...updates } : null);
  }, [apiState]);

  return {
    ...apiState,
    updateField,
    updateFields,
  };
}

/**
 * 페이지네이션과 함께 사용하는 API 상태 훅
 */
export function usePaginatedApiState<T>() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const apiState = useApiState<T[]>([]);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);
  
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);
  
  const updatePaginationInfo = useCallback((info: {
    totalItems?: number;
    hasMore?: boolean;
    itemsPerPage?: number;
  }) => {
    if (info.totalItems !== undefined) setTotalItems(info.totalItems);
    if (info.hasMore !== undefined) setHasMore(info.hasMore);
    if (info.itemsPerPage !== undefined) setItemsPerPage(info.itemsPerPage);
  }, []);

  return {
    ...apiState,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasMore,
    setCurrentPage,
    setItemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    updatePaginationInfo,
  };
}

/**
 * 정렬 기능과 함께 사용하는 API 상태 훅
 */
export function useSortableApiState<T>(
  initialSortBy: string = 'created_at',
  initialOrder: 'asc' | 'desc' = 'desc'
) {
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);
  
  const apiState = useApiState<T[]>([]);
  
  const changeSortBy = useCallback((newSortBy: string) => {
    if (sortBy === newSortBy) {
      // 같은 필드 클릭 시 순서 반전
      setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setOrder('desc'); // 새 필드는 기본적으로 내림차순
    }
  }, [sortBy]);
  
  const toggleOrder = useCallback(() => {
    setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  return {
    ...apiState,
    sortBy,
    order,
    setSortBy,
    setOrder,
    changeSortBy,
    toggleOrder,
  };
}

/**
 * 폼 제출을 위한 API 상태 훅
 */
export function useFormApiState() {
  const apiState = useApiState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitForm = useCallback(async <T>(
    submitFunction: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      resetOnSuccess?: boolean;
    } = {}
  ) => {
    if (isSubmitting) return null;
    
    setIsSubmitting(true);
    
    const result = await apiState.executeAsync(submitFunction, {
      onSuccess: (data) => {
        if (options.resetOnSuccess) {
          apiState.reset();
        }
        options.onSuccess?.(data);
      },
      onError: options.onError,
    });
    
    setIsSubmitting(false);
    return result;
  }, [apiState, isSubmitting]);

  return {
    ...apiState,
    isSubmitting,
    submitForm,
  };
}

/**
 * 무한 스크롤을 위한 API 상태 훅
 */
export function useInfiniteScrollApiState<T>() {
  const [allItems, setAllItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const apiState = useApiState<T[]>();
  
  const loadMore = useCallback(async (
    loadFunction: (page: number) => Promise<{ items: T[]; hasMore: boolean }>
  ) => {
    if (apiState.loading || !hasMore) return;
    
    const result = await apiState.executeAsync(
      () => loadFunction(page),
      {
        transformData: (data) => data.items,
        onSuccess: (data) => {
          setAllItems(prev => [...prev, ...data.items]);
          setHasMore(data.hasMore);
          setPage(prev => prev + 1);
        }
      }
    );
    
    return result;
  }, [apiState, page, hasMore]);
  
  const reset = useCallback(() => {
    apiState.reset();
    setAllItems([]);
    setHasMore(true);
    setPage(1);
  }, [apiState]);

  return {
    ...apiState,
    allItems,
    hasMore,
    page,
    loadMore,
    reset,
  };
}