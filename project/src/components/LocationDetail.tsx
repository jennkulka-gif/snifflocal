import { useState, useEffect } from 'react';
import { X, Star, Camera } from 'lucide-react';
import { Location, Rating, Photo, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LocationDetailProps {
  location: Location;
  onClose: () => void;
  onUpdate: () => void;
}

export function LocationDetail({ location, onClose, onUpdate }: LocationDetailProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadLocationData();
  }, [location.id]);

  const loadLocationData = async () => {
    try {
      const [ratingsRes, photosRes] = await Promise.all([
        supabase
          .from('ratings')
          .select('*, profiles(username, avatar_url)')
          .eq('location_id', location.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('photos')
          .select('*, profiles(username, avatar_url)')
          .eq('location_id', location.id)
          .order('created_at', { ascending: false }),
      ]);

      if (ratingsRes.data) setRatings(ratingsRes.data);
      if (photosRes.data) setPhotos(photosRes.data);

      if (user) {
        const existingRating = ratingsRes.data?.find(r => r.user_id === user.id);
        if (existingRating) {
          setUserRating(existingRating.rating);
          setComment(existingRating.comment || '');
        }
      }
    } catch (error) {
      console.error('Error loading location data:', error);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userRating === 0) return;

    try {
      const { error } = await supabase
        .from('ratings')
        .upsert({
          location_id: location.id,
          user_id: user.id,
          rating: userRating,
          comment: comment.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setShowRatingForm(false);
      await loadLocationData();
      onUpdate();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          location_id: location.id,
          user_id: user.id,
          photo_url: publicUrl,
        });

      if (dbError) throw dbError;

      await loadLocationData();
      onUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const renderTailWags = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="text-xl">
            {i <= rating ? '🐕' : '🐾'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{location.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                {renderTailWags(Math.round(location.average_rating))}
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {location.average_rating.toFixed(1)}
              </span>
              <span className="text-gray-500">
                ({location.total_ratings} {location.total_ratings === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
            {location.description && (
              <p className="text-gray-600 mb-2">{location.description}</p>
            )}
            {location.address && (
              <p className="text-sm text-gray-500">{location.address}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowRatingForm(!showRatingForm)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Star size={20} />
              {userRating > 0 ? 'Update Rating' : 'Rate Location'}
            </button>
            <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer">
              <Camera size={20} />
              {uploading ? 'Uploading...' : 'Add Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {showRatingForm && (
            <form onSubmit={handleSubmitRating} className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setUserRating(rating)}
                      className="text-3xl hover:scale-110 transition"
                    >
                      {rating <= userRating ? '🐕' : '🐾'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Share your experience..."
                />
              </div>

              <button
                type="submit"
                disabled={userRating === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Rating
              </button>
            </form>
          )}

          {photos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo.photo_url}
                      alt="Dog photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {ratings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Reviews</h3>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {rating.profiles?.username || 'Anonymous'}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {renderTailWags(rating.rating)}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-gray-600">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
