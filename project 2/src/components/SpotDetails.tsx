import { X, MapPin, Star } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Spot = Database['public']['Tables']['spots']['Row'] & {
  categories: { name: string; icon: string };
  distance?: number;
};

type Review = Database['public']['Tables']['reviews']['Row'];

interface SpotDetailsProps {
  spot: Spot;
  reviews: Review[];
  onClose: () => void;
}

export function SpotDetails({ spot, reviews, onClose }: SpotDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
          <div className="relative">
            <img
              src={spot.image_url}
              alt={spot.name}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full font-semibold shadow-lg">
              {spot.categories.name}
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {spot.name}
            </h2>

            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MapPin size={18} />
              <span>{spot.address}</span>
              {spot.distance && (
                <span className="ml-auto text-indigo-600 font-semibold">
                  {spot.distance.toFixed(1)} km away
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-bold text-gray-900">
                {spot.average_rating.toFixed(1)}
              </span>
              <span className="text-gray-500">({spot.total_reviews} reviews)</span>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {spot.description}
            </p>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {spot.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reviews</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 italic">No reviews yet</p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {review.user_name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star
                            size={16}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          <span className="font-semibold">{review.rating}</span>
                        </div>
                        <span className="text-gray-500 text-sm ml-auto">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
