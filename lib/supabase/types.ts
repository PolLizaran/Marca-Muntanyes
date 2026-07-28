export type Difficulty = "facil" | "moderada" | "dificil";
export type RouteSource = "manual" | "gpx" | "kml";
export type FriendshipStatus = "pending" | "accepted" | "declined";

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

export type RouteRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  route_date: string | null;
  source: RouteSource;
  track_geojson: GeoJSON.LineString | GeoJSON.MultiLineString | null;
  distance_m: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;
  duration_min: number | null;
  difficulty: Difficulty | null;
  created_at: string;
};

export type Summit = {
  id: string;
  route_id: string | null;
  user_id: string;
  name: string;
  elevation_m: number | null;
  lat: number;
  lng: number;
  notes: string | null;
  reached_at: string | null;
  created_at: string;
};

export type RoutePhoto = {
  id: string;
  route_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
        Relationships: Relationship[];
      };
      friendships: {
        Row: Friendship;
        Insert: Partial<Friendship> & { requester_id: string; addressee_id: string };
        Update: Partial<Friendship>;
        Relationships: Relationship[];
      };
      routes: {
        Row: RouteRow;
        Insert: Partial<RouteRow> & { user_id: string; name: string };
        Update: Partial<RouteRow>;
        Relationships: Relationship[];
      };
      summits: {
        Row: Summit;
        Insert: Partial<Summit> & { user_id: string; name: string; lat: number; lng: number };
        Update: Partial<Summit>;
        Relationships: Relationship[];
      };
      route_photos: {
        Row: RoutePhoto;
        Insert: Partial<RoutePhoto> & { route_id: string; user_id: string; storage_path: string };
        Update: Partial<RoutePhoto>;
        Relationships: Relationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
