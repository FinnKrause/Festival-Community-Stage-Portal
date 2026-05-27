type database_boolean = "TRUE" | "FALSE";

export type AppState = {
  enable_autoplay: database_boolean;
  enable_page: database_boolean;
  enable_dj: database_boolean;
  enable_spotify_player: database_boolean;
  enable_rekordbox_player: database_boolean;
  dp_message: string;
  autoplay_message: string;
  dj_name: string;
  dj_insta: string;
  dj_message: string;
  dj_avatar_url: string;
};

export interface Song {
  spotify_id: string;
  title: string;
  artist: string;
  cover_url: string;
  votes: number;
  created_at: number;
  device_id: string;
  queued: "TRUE" | "FALSE";
  queued_at: number;
}

export interface Request {
  song_id: number;
  device_id: string | null;
  created_at: number | null;
}
