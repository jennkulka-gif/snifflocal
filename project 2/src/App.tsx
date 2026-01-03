import { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { calculateDistance, getUserLocation, type Coordinates } from './utils/geolocation';
import { SpotCard } from './components/SpotCard';
import { SpotDetails } from './components/SpotDetails';
import { CategoryFilter } from './components/CategoryFilter';
import type { Database } from './lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];
type Spot = Database['public']['Tables']['spots']['Row'] & {
  categories: { name: string; icon: string };
  distance?: number;
};
type Review = Database['public']['Tables']['reviews']['Row'];

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredSpots(spots);
    } else {
      setFilteredSpots(spots.filter(spot => spot.category_id === selectedCategory));
    }
  }, [selectedCategory, spots]);

  async function fetchData() {
    try {
      const [categoriesResult, spotsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('spots')
          .select('*, categories(name, icon)')
          .order('average_rating', { ascending: false }),
      ]);

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (spotsResult.data) {
        setSpots(spotsResult.data as Spot[]);
        setFilteredSpots(spotsResult.data as Spot[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetLocation() {
    setLocationLoading(true);
    const location = await getUserLocation();
    if (location) {
      setUserLocation(location);
      const spotsWithDistance = spots.map(spot => ({
        ...spot,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          spot.latitude,
          spot.longitude
        ),
      }));
      spotsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setSpots(spotsWithDistance);
      setFilteredSpots(
        selectedCategory === null
          ? spotsWithDistance
          : spotsWithDistance.filter(spot => spot.category_id === selectedCategory)
      );
    }
    setLocationLoading(false);
  }

  async function handleSpotClick(spot: Spot) {
    setSelectedSpot(spot);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('spot_id', spot.id)
      .order('created_at', { ascending: false });
    if (data) {
      setReviews(data);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                SniffLocal
              </h1>
              <p className="text-gray-600">Discover dog-friendly spots near you</p>
            </div>
            <button
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {locationLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin size={20} />
              )}
              {userLocation ? 'Update Location' : 'Use My Location'}
            </button>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </header>

        {filteredSpots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No spots found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                onClick={() => handleSpotClick(spot)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedSpot && (
        <SpotDetails
          spot={selectedSpot}
          reviews={reviews}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
}

export default App;
