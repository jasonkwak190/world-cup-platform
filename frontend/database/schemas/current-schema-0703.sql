-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.backup_comment_likes (
  id uuid,
  user_id uuid,
  comment_id uuid,
  created_at timestamp with time zone
);
CREATE TABLE public.backup_user_bookmarks (
  id uuid,
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone
);
CREATE TABLE public.backup_users (
  id uuid,
  username character varying,
  email character varying,
  profile_image_url text,
  role character varying,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  display_name character varying,
  bio text,
  cover_image_url text,
  is_verified boolean,
  is_active boolean,
  followers_count integer,
  following_count integer,
  worldcups_count integer,
  last_login_at timestamp with time zone
);
CREATE TABLE public.backup_worldcup_bookmarks (
  id uuid,
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone
);
CREATE TABLE public.backup_worldcup_comments (
  id uuid,
  worldcup_id uuid,
  user_id uuid,
  content text,
  parent_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  likes integer,
  username text,
  guest_session_id text
);
CREATE TABLE public.backup_worldcup_likes (
  id uuid,
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone
);
CREATE TABLE public.backup_worldcups (
  id uuid,
  title character varying,
  description text,
  category character varying,
  thumbnail_url text,
  author_id uuid,
  participants integer,
  likes integer,
  comments integer,
  is_public boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  category_id integer,
  slug character varying,
  status character varying,
  visibility character varying,
  allow_anonymous_play boolean,
  tags ARRAY,
  search_vector tsvector,
  bookmark_count integer
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  icon_name character varying,
  color_hex character varying DEFAULT '#10B981'::character varying,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  worldcups_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  comment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.worldcup_comments(id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid NOT NULL,
  author_id uuid,
  parent_id uuid,
  content text NOT NULL CHECK (length(TRIM(BOTH FROM content)) >= 1 AND length(content) <= 2000),
  guest_name character varying,
  guest_session_id character varying,
  is_edited boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  like_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id),
  CONSTRAINT comments_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.game_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  worldcup_id uuid NOT NULL,
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  item1_id uuid NOT NULL,
  item2_id uuid NOT NULL,
  winner_id uuid NOT NULL,
  decision_time_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_matches_pkey PRIMARY KEY (id),
  CONSTRAINT game_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.worldcup_items(id),
  CONSTRAINT game_matches_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.game_sessions(id),
  CONSTRAINT game_matches_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT game_matches_item1_id_fkey FOREIGN KEY (item1_id) REFERENCES public.worldcup_items(id),
  CONSTRAINT game_matches_item2_id_fkey FOREIGN KEY (item2_id) REFERENCES public.worldcup_items(id)
);
CREATE TABLE public.game_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid,
  user_id uuid,
  winner_item_id uuid,
  runner_up_item_id uuid,
  rounds_played integer NOT NULL,
  play_time_seconds integer,
  user_ip inet,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_results_pkey PRIMARY KEY (id),
  CONSTRAINT game_results_winner_item_id_fkey FOREIGN KEY (winner_item_id) REFERENCES public.worldcup_items(id),
  CONSTRAINT game_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT game_results_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT game_results_runner_up_item_id_fkey FOREIGN KEY (runner_up_item_id) REFERENCES public.worldcup_items(id)
);
CREATE TABLE public.game_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid NOT NULL,
  player_id uuid,
  session_token character varying UNIQUE,
  tournament_bracket jsonb,
  current_round integer DEFAULT 1,
  status character varying DEFAULT 'in_progress'::character varying CHECK (status::text = ANY (ARRAY['in_progress'::character varying, 'completed'::character varying, 'abandoned'::character varying]::text[])),
  winner_item_id uuid,
  runner_up_item_id uuid,
  total_rounds integer,
  total_matches integer,
  play_time_seconds integer,
  player_ip inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT game_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT game_sessions_runner_up_item_id_fkey FOREIGN KEY (runner_up_item_id) REFERENCES public.worldcup_items(id),
  CONSTRAINT game_sessions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id),
  CONSTRAINT game_sessions_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT game_sessions_winner_item_id_fkey FOREIGN KEY (winner_item_id) REFERENCES public.worldcup_items(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  actor_id uuid,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['like_worldcup'::character varying, 'comment_worldcup'::character varying, 'follow_user'::character varying, 'featured_worldcup'::character varying, 'worldcup_trending'::character varying, 'system_announcement'::character varying]::text[])),
  title character varying NOT NULL,
  message text,
  target_type character varying CHECK (target_type::text = ANY (ARRAY['worldcup'::character varying, 'comment'::character varying, 'user'::character varying]::text[])),
  target_id uuid,
  is_read boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT user_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_bookmarks_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id)
);
CREATE TABLE public.user_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type character varying NOT NULL CHECK (target_type::text = ANY (ARRAY['worldcup'::character varying, 'comment'::character varying, 'user'::character varying]::text[])),
  target_id uuid NOT NULL,
  interaction_type character varying NOT NULL CHECK (interaction_type::text = ANY (ARRAY['like'::character varying, 'bookmark'::character varying, 'follow'::character varying, 'report'::character varying, 'block'::character varying]::text[])),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_likes_pkey PRIMARY KEY (id),
  CONSTRAINT user_likes_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT user_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  profile_image_url text,
  role character varying DEFAULT 'user'::character varying CHECK (role::text = ANY (ARRAY['user'::character varying, 'admin'::character varying, 'moderator'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  display_name character varying,
  bio text,
  cover_image_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  worldcups_count integer DEFAULT 0,
  last_login_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.worldcup_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worldcup_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_bookmarks_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT worldcup_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.worldcup_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid,
  user_id uuid,
  content text NOT NULL,
  parent_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  likes integer DEFAULT 0,
  username text,
  guest_session_id text,
  CONSTRAINT worldcup_comments_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT worldcup_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.worldcup_comments(id),
  CONSTRAINT worldcup_comments_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id)
);
CREATE TABLE public.worldcup_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid,
  title character varying NOT NULL,
  image_url text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  seed integer,
  win_count integer NOT NULL DEFAULT 0,
  loss_count integer NOT NULL DEFAULT 0,
  win_rate numeric NOT NULL DEFAULT 0,
  video_url text,
  video_start_time integer DEFAULT 0,
  video_end_time integer,
  source_url text,
  attribution text,
  total_appearances integer NOT NULL DEFAULT 0,
  championship_wins integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT worldcup_items_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_items_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id)
);
CREATE TABLE public.worldcup_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worldcup_likes_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_likes_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT worldcup_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.worldcups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  category character varying DEFAULT 'entertainment'::character varying,
  thumbnail_url text,
  author_id uuid,
  participants integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category_id integer,
  slug character varying,
  status character varying DEFAULT 'published'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying, 'banned'::character varying]::text[])),
  visibility character varying DEFAULT 'public'::character varying CHECK (visibility::text = ANY (ARRAY['public'::character varying, 'private'::character varying, 'unlisted'::character varying]::text[])),
  allow_anonymous_play boolean DEFAULT true,
  tags ARRAY,
  search_vector tsvector,
  bookmark_count integer DEFAULT 0,
  CONSTRAINT worldcups_pkey PRIMARY KEY (id),
  CONSTRAINT worldcups_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT worldcups_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);