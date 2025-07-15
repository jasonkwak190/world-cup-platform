// 보안 감사 로깅 시스템
import { AuditLog } from '@/types/security';

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * 감사 로그 기록
   */
  async log(
    eventType: AuditLog['event_type'],
    targetType: AuditLog['target_type'],
    targetId: string,
    details: Record<string, any>,
    userId?: string,
    adminId?: string
  ): Promise<void> {
    if (!this.isEnabled) return;

    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      event_type: eventType,
      target_type: targetType,
      target_id: targetId,
      user_id: userId,
      admin_id: adminId,
      details,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    };

    // 로컬 스토리지에 임시 저장
    this.logs.push(auditLog);
    this.saveToLocalStorage();

    // 서버로 전송
    try {
      await this.sendToServer(auditLog);
    } catch (error) {
      console.error('Failed to send audit log to server:', error);
      // 서버 전송 실패 시 로컬에 유지
    }
  }

  /**
   * 콘텐츠 업로드 감사
   */
  async logContentUpload(
    contentId: string,
    contentType: 'image' | 'video',
    userId: string,
    metadata: {
      file_size?: number;
      file_type?: string;
      source_url?: string;
      license_type?: string;
    }
  ): Promise<void> {
    await this.log(
      'content_upload',
      'worldcup_item',
      contentId,
      {
        content_type: contentType,
        metadata,
        timestamp: Date.now()
      },
      userId
    );
  }

  /**
   * 콘텐츠 제거 감사
   */
  async logContentRemoval(
    contentId: string,
    reason: string,
    userId?: string,
    adminId?: string
  ): Promise<void> {
    await this.log(
      'content_removal',
      'worldcup_item',
      contentId,
      {
        reason,
        removed_by: adminId ? 'admin' : 'user',
        timestamp: Date.now()
      },
      userId,
      adminId
    );
  }

  /**
   * 라이선스 변경 감사
   */
  async logLicenseChange(
    contentId: string,
    oldLicense: string,
    newLicense: string,
    userId?: string,
    adminId?: string
  ): Promise<void> {
    await this.log(
      'license_change',
      'worldcup_item',
      contentId,
      {
        old_license: oldLicense,
        new_license: newLicense,
        timestamp: Date.now()
      },
      userId,
      adminId
    );
  }

  /**
   * 플래그 생성 감사
   */
  async logFlagCreated(
    contentId: string,
    flagType: string,
    severity: string,
    userId: string,
    description: string
  ): Promise<void> {
    await this.log(
      'flag_created',
      'worldcup_item',
      contentId,
      {
        flag_type: flagType,
        severity,
        description,
        timestamp: Date.now()
      },
      userId
    );
  }

  /**
   * 플래그 해결 감사
   */
  async logFlagResolved(
    contentId: string,
    flagId: string,
    resolution: 'resolved' | 'dismissed',
    adminId: string,
    notes?: string
  ): Promise<void> {
    await this.log(
      'flag_resolved',
      'worldcup_item',
      contentId,
      {
        flag_id: flagId,
        resolution,
        resolution_notes: notes,
        timestamp: Date.now()
      },
      undefined,
      adminId
    );
  }

  /**
   * 로그 검색
   */
  searchLogs(filters: {
    eventType?: AuditLog['event_type'];
    targetType?: AuditLog['target_type'];
    targetId?: string;
    userId?: string;
    adminId?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    return this.logs.filter(log => {
      if (filters.eventType && log.event_type !== filters.eventType) return false;
      if (filters.targetType && log.target_type !== filters.targetType) return false;
      if (filters.targetId && log.target_id !== filters.targetId) return false;
      if (filters.userId && log.user_id !== filters.userId) return false;
      if (filters.adminId && log.admin_id !== filters.adminId) return false;
      
      const logDate = new Date(log.created_at);
      if (filters.startDate && logDate < filters.startDate) return false;
      if (filters.endDate && logDate > filters.endDate) return false;
      
      return true;
    });
  }

  /**
   * 로그 통계
   */
  getLogStats(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): {
    total: number;
    by_event_type: Record<string, number>;
    by_target_type: Record<string, number>;
    timeline: Array<{ date: string; count: number }>;
  } {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case 'hour':
        cutoff.setHours(now.getHours() - 1);
        break;
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }

    const filteredLogs = this.logs.filter(log => 
      new Date(log.created_at) >= cutoff
    );

    const byEventType: Record<string, number> = {};
    const byTargetType: Record<string, number> = {};

    filteredLogs.forEach(log => {
      byEventType[log.event_type] = (byEventType[log.event_type] || 0) + 1;
      byTargetType[log.target_type] = (byTargetType[log.target_type] || 0) + 1;
    });

    return {
      total: filteredLogs.length,
      by_event_type: byEventType,
      by_target_type: byTargetType,
      timeline: this.generateTimeline(filteredLogs, timeRange)
    };
  }

  /**
   * 클라이언트 IP 주소 가져오기
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/client-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 로컬 스토리지에 저장
   */
  private saveToLocalStorage(): void {
    try {
      // 최근 1000개 로그만 유지
      const recentLogs = this.logs.slice(-1000);
      localStorage.setItem('audit_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save audit logs to localStorage:', error);
    }
  }

  /**
   * 로컬 스토리지에서 로드
   */
  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('audit_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load audit logs from localStorage:', error);
    }
  }

  /**
   * 서버로 전송
   */
  private async sendToServer(log: AuditLog): Promise<void> {
    const response = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log)
    });

    if (!response.ok) {
      throw new Error('Failed to send audit log to server');
    }
  }

  /**
   * 타임라인 생성
   */
  private generateTimeline(
    logs: AuditLog[], 
    timeRange: 'hour' | 'day' | 'week' | 'month'
  ): Array<{ date: string; count: number }> {
    const timeline: Record<string, number> = {};
    
    logs.forEach(log => {
      const date = new Date(log.created_at);
      let key: string;
      
      switch (timeRange) {
        case 'hour':
          key = `${date.getHours()}:00`;
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
        case 'month':
          key = date.toISOString().split('T')[0];
          break;
      }
      
      timeline[key] = (timeline[key] || 0) + 1;
    });

    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 로깅 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 로그 정리
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('audit_logs');
  }

  /**
   * 로그 내보내기
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV 형식으로 변환
      const headers = ['ID', 'Event Type', 'Target Type', 'Target ID', 'User ID', 'Admin ID', 'IP Address', 'Created At'];
      const rows = this.logs.map(log => [
        log.id,
        log.event_type,
        log.target_type,
        log.target_id,
        log.user_id || '',
        log.admin_id || '',
        log.ip_address || '',
        log.created_at
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * 초기화
   */
  init(): void {
    this.loadFromLocalStorage();
    
    // 페이지 언로드 시 로그 저장
    window.addEventListener('beforeunload', () => {
      this.saveToLocalStorage();
    });
  }
}

// 전역 인스턴스 생성
export const auditLogger = AuditLogger.getInstance();

// 자동 초기화
if (typeof window !== 'undefined') {
  auditLogger.init();
}