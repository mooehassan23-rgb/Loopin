export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  is_3d: boolean;
  is_archived?: boolean;
  expires_at?: string | null;
  created_at: string;
  profiles?: Profile; // Joined data
  likes?: Like[];     // Joined data
  comments?: { count: number }[]; // Joined count
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id?: string;
  read: boolean;
  created_at: string;
  actor?: Profile; // Joined manually or via view
  post?: Post;
}

export interface Conversation {
  id: string;
  updated_at: string;
  participants?: { user_id: string, profiles: Profile }[];
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}
