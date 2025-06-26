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
          created_at: string;
        };
        Insert: {
          id?: string;
          worldcup_id: string;
          title: string;
          image_url: string;
          description?: string | null;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          worldcup_id?: string;
          title?: string;
          image_url?: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      worldcup_likes: {
        Row: {
          id: string;
          user_id: string;
          worldcup_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          worldcup_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          worldcup_id?: string;
          created_at?: string;
        };
      };
      worldcup_bookmarks: {
        Row: {
          id: string;
          user_id: string;
          worldcup_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          worldcup_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          worldcup_id?: string;
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
      worldcup_comments: {
        Row: {
          id: string;
          worldcup_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worldcup_id: string;
          user_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worldcup_id?: string;
          user_id?: string;
          content?: string;
          parent_id?: string | null;
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

export type SupabaseWorldCupLike = Database['public']['Tables']['worldcup_likes']['Row'];
export type SupabaseWorldCupBookmark = Database['public']['Tables']['worldcup_bookmarks']['Row'];
export type SupabaseGameResult = Database['public']['Tables']['game_results']['Row'];
export type SupabaseWorldCupComment = Database['public']['Tables']['worldcup_comments']['Row'];

// 조인된 데이터를 위한 확장 타입
export interface SupabaseWorldCupWithItems extends SupabaseWorldCup {
  worldcup_items: SupabaseWorldCupItem[];
  author: Pick<SupabaseUser, 'id' | 'username' | 'profile_image_url'>;
}

export interface SupabaseWorldCupWithAuthor extends SupabaseWorldCup {
  author: Pick<SupabaseUser, 'id' | 'username' | 'profile_image_url'>;
}