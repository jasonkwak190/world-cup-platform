/**
 * 초를 시:분:초 형식으로 변환하는 유틸리티 함수
 */

/**
 * 초를 시:분:초 또는 분:초 형식으로 변환
 * @param seconds 초 단위 시간
 * @returns 포맷된 시간 문자열 (예: "1:23:45", "5:30", "0:45")
 */
export function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // 시간이 있으면 시:분:초 형식
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // 시간이 없으면 분:초 형식
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 시작~끝 시간을 포맷된 문자열로 변환
 * @param startTime 시작 시간 (초)
 * @param endTime 끝 시간 (초, optional)
 * @returns 포맷된 시간 범위 문자열 (예: "1:30 ~ 2:45", "0:30 ~ 끝")
 */
export function formatTimeRange(startTime?: number, endTime?: number): string {
  if (!startTime && !endTime) return "";
  
  const start = startTime ? formatTime(startTime) : "0:00";
  
  if (!endTime) {
    return `${start} ~ 끝`;
  }
  
  return `${start} ~ ${formatTime(endTime)}`;
}

/**
 * 초를 "N초" 형식으로 변환 (기존 호환성용)
 * @param seconds 초
 * @returns "N초" 형식 문자열
 */
export function formatSeconds(seconds: number): string {
  return `${seconds}초`;
}