type database_boolean = "TRUE" | "FALSE";

export type AppState = {
  enable_page: database_boolean;
  enable_dj: database_boolean;
  enable_player: database_boolean;
  dp_message: string;

  dj_name: string;
  dj_insta: string;
  dj_message: string;
  dj_avatar_url: string;
};
