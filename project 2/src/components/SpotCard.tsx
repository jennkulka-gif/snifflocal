import { MapPin, Star } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Spot = Database['public']['Tables']['spots']['Row'] & {
  categories: { name: string; icon: string };
  distance?: number;
};

interface SpotCardProps {
  spot: Spot;
  onClick: () => void;
}

export function SpotCard({ spot, onClick }: SpotCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={spot.image_url}
          alt={spot.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
          {spot.categories.name}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{spot.name}</h3>
        <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
          <MapPin size={16} />
          <span>{spot.address}</span>
          {spot.distance && (
            <span className="ml-auto text-indigo-600 font-semibold">
              {spot.distance.toFixed(1)} km
            </span>
          )}
        </div>
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
          {spot.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={18} className="fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-gray-900">
              {spot.average_rating.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm">
              ({spot.total_reviews})
            </span>
          </div>
          <div className="flex gap-2">
            {spot.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
