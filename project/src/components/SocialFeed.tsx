import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FeedItem {
  id: string;
  type: 'rating' | 'photo';
  user: {
    username: string;
    avatar_url: string | null;
  };
  location: {
    id: string;
    name: string;
  };
  created_at: string;
  rating?: number;
  comment?: string | null;
  photo_url?: string;
  caption?: string | null;
}

interface SocialFeedProps {
  onClose: () => void;
  onLocationSelect: (locationId: string) => void;
}

export function SocialFeed({ onClose, onLocationSelect }: SocialFeedProps) {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: friendsData } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const friendIds = friendsData?.map(f => f.friend_id) || [];

      if (friendIds.length === 0) {
        setFeedItems([]);
        setLoading(false);
        return;
      }

      const [ratingsRes, photosRes] = await Promise.all([
        supabase
          .from('ratings')
          .select(`
            id,
            rating,
            comment,
            created_at,
            user_id,
            profiles:user_id (username, avatar_url),
            locations:location_id (id, name)
          `)
          .in('user_id', friendIds)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('photos')
          .select(`
            id,
            photo_url,
            caption,
            created_at,
            user_id,
            profiles:user_id (username, avatar_url),
            locations:location_id (id, name)
          `)
          .in('user_id', friendIds)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const items: FeedItem[] = [];

      ratingsRes.data?.forEach((rating: any) => {
        items.push({
          id: rating.id,
          type: 'rating',
          user: rating.profiles,
          location: rating.locations,
          created_at: rating.created_at,
          rating: rating.rating,
          comment: rating.comment,
        });
      });

      photosRes.data?.forEach((photo: any) => {
        items.push({
          id: photo.id,
          type: 'photo',
          user: photo.profiles,
          location: photo.locations,
          created_at: photo.created_at,
          photo_url: photo.photo_url,
          caption: photo.caption,
        });
      });

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedItems(items);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTailWags = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="text-lg">
            {i <= rating ? '🐕' : '🐾'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Friends Activity</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading feed...</div>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <p className="text-2xl mb-2">🐕</p>
            <p className="text-gray-600 mb-4">
              No activity yet from your friends.
            </p>
            <p className="text-sm text-gray-500">
              Add friends to see their ratings and photos!
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            {feedItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        {item.user.avatar_url ? (
                          <img
                            src={item.user.avatar_url}
                            alt={item.user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">🐕</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.user.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()} at{' '}
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {item.type === 'rating' ? (
                    <div>
                      <div className="mb-2">{renderTailWags(item.rating!)}</div>
                      {item.comment && (
                        <p className="text-gray-700 mb-3">{item.comment}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {item.photo_url && (
                        <img
                          src={item.photo_url}
                          alt="Dog photo"
                          className="w-full rounded-lg mb-2"
                        />
                      )}
                      {item.caption && (
                        <p className="text-gray-700 mb-3">{item.caption}</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      onLocationSelect(item.location.id);
                      onClose();
                    }}
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    <MapPin size={16} />
                    {item.location.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
