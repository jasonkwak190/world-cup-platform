// Supabase 전용 타입 정의
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          profile_image_url: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          profile_image_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          profile_image_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      worldcups: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          thumbnail_url: string | null;
          author_id: string;
          participants: number;
          likes: number;
          comments: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string;
          thumbnail_url?: string | null;
          author_id: string;
          participants?: number;
          likes?: number;
          comments?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          thumbnail_url?: string | null;
          author_id?: string;
          participants?: number;
          likes?: number;
          comments?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      worldcup_items: {
        Row: {
          id: string;
          worldcup_id: string;
          title: string;
          image_url: string;
          description: string | null;
          order_index: number;
          win_count: number;
          loss_count: number;
          win_rate: number;
          total_appearances: number;
          championship_wins: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worldcup_id: string;
          title: string;
          image_url: string;
          description?: string | null;
          order_index: number;
          win_count?: number;
          loss_count?: number;
          win_rate?: number;
          total_appearances?: number;
          championship_wins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worldcup_id?: string;
          title?: string;
          image_url?: string;
          description?: string | null;
          order_index?: number;
          win_count?: number;
          loss_count?: number;
          win_rate?: number;
          total_appearances?: number;
          championship_wins?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_interactions: {
        Row: {
          id: string;
          user_id: string;
          target_type: 'worldcup' | 'comment' | 'user';
          target_id: string;
          interaction_type: 'like' | 'bookmark' | 'follow' | 'report' | 'block';
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: 'worldcup' | 'comment' | 'user';
          target_id: string;
          interaction_type: 'like' | 'bookmark' | 'follow' | 'report' | 'block';
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_type?: 'worldcup' | 'comment' | 'user';
          target_id?: string;
          interaction_type?: 'like' | 'bookmark' | 'follow' | 'report' | 'block';
          metadata?: any;
          created_at?: string;
        };
      };
      game_results: {
        Row: {
          id: string;
          worldcup_id: string;
          user_id: string | null;
          winner_item_id: string;
          runner_up_item_id: string;
          rounds_played: number;
          play_time_seconds: number | null;
          user_ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worldcup_id: string;
          user_id?: string | null;
          winner_item_id: string;
          runner_up_item_id: string;
          rounds_played: number;
          play_time_seconds?: number | null;
          user_ip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          worldcup_id?: string;
          user_id?: string | null;
          winner_item_id?: string;
          runner_up_item_id?: string;
          rounds_played?: number;
          play_time_seconds?: number | null;
          user_ip?: string | null;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          worldcup_id: string;
          author_id: string | null;
          parent_id: string | null;
          content: string;
          guest_name: string | null;
          guest_session_id: string | null;
          is_edited: boolean;
          is_pinned: boolean;
          is_deleted: boolean;
          like_count: number;
          reply_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worldcup_id: string;
          author_id?: string | null;
          parent_id?: string | null;
          content: string;
          guest_name?: string | null;
          guest_session_id?: string | null;
          is_edited?: boolean;
          is_pinned?: boolean;
          is_deleted?: boolean;
          like_count?: number;
          reply_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worldcup_id?: string;
          author_id?: string | null;
          parent_id?: string | null;
          content?: string;
          guest_name?: string | null;
          guest_session_id?: string | null;
          is_edited?: boolean;
          is_pinned?: boolean;
          is_deleted?: boolean;
          like_count?: number;
          reply_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// 편의를 위한 타입 별칭
export type SupabaseUser = Database['public']['Tables']['users']['Row'];
export type SupabaseUserInsert = Database['public']['Tables']['users']['Insert'];
export type SupabaseUserUpdate = Database['public']['Tables']['users']['Update'];

export type SupabaseWorldCup = Database['public']['Tables']['worldcups']['Row'];
export type SupabaseWorldCupInsert = Database['public']['Tables']['worldcups']['Insert'];
export type SupabaseWorldCupUpdate = Database['public']['Tables']['worldcups']['Update'];

export type SupabaseWorldCupItem = Database['public']['Tables']['worldcup_items']['Row'];
export type SupabaseWorldCupItemInsert = Database['public']['Tables']['worldcup_items']['Insert'];
export type SupabaseWorldCupItemUpdate = Database['public']['Tables']['worldcup_items']['Update'];

// 구버전 타입들은 user_interactions로 통합됨
export type SupabaseGameResult = Database['public']['Tables']['game_results']['Row'];
export type SupabaseComment = Database['public']['Tables']['comments']['Row'];
export type SupabaseUserInteraction = Database['public']['Tables']['user_interactions']['Row'];

// 조인된 데이터를 위한 확장 타입
export interface SupabaseWorldCupWithItems extends SupabaseWorldCup {
  worldcup_items: SupabaseWorldCupItem[];
  author: Pick<SupabaseUser, 'id' | 'username' | 'profile_image_url'>;
}

export interface SupabaseWorldCupWithAuthor extends SupabaseWorldCup {
  author: Pick<SupabaseUser, 'id' | 'username' | 'profile_image_url'>;
}