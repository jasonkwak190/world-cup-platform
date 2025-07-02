-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  comment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.worldcup_comments(id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  CONSTRAINT game_results_runner_up_item_id_fkey FOREIGN KEY (runner_up_item_id) REFERENCES public.worldcup_items(id),
  CONSTRAINT game_results_winner_item_id_fkey FOREIGN KEY (winner_item_id) REFERENCES public.worldcup_items(id),
  CONSTRAINT game_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT game_results_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id)
);
CREATE TABLE public.user_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT user_bookmarks_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT user_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  role character varying DEFAULT 'user'::character varying CHECK (role::text = ANY (ARRAY['user'::character varying, 'admin'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.worldcup_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worldcup_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT worldcup_bookmarks_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id)
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
  CONSTRAINT worldcup_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.worldcup_comments(id),
  CONSTRAINT worldcup_comments_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id),
  CONSTRAINT worldcup_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.worldcup_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid,
  title character varying NOT NULL,
  image_url text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worldcup_items_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_items_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id)
);
CREATE TABLE public.worldcup_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  worldcup_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worldcup_likes_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT worldcup_likes_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id)
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
  CONSTRAINT worldcups_pkey PRIMARY KEY (id),
  CONSTRAINT worldcups_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);