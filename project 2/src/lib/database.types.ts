export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          created_at?: string;
        };
      };
      spots: {
        Row: {
          id: string;
          name: string;
          description: string;
          category_id: string;
          address: string;
          latitude: number;
          longitude: number;
          image_url: string;
          amenities: string[];
          average_rating: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category_id: string;
          address: string;
          latitude: number;
          longitude: number;
          image_url: string;
          amenities?: string[];
          average_rating?: number;
          total_reviews?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category_id?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          image_url?: string;
          amenities?: string[];
          average_rating?: number;
          total_reviews?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          spot_id: string;
          user_name: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          spot_id: string;
          user_name: string;
          rating: number;
          comment: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          spot_id?: string;
          user_name?: string;
          rating?: number;
          comment?: string;
          created_at?: string;
        };
      };
    };
  };
}
