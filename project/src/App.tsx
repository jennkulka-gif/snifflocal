import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { MapView } from './components/MapView';
import { LocationDetail } from './components/LocationDetail';
import { AddLocationModal } from './components/AddLocationModal';
import { SocialFeed } from './components/SocialFeed';
import { FavoriteLists } from './components/FavoriteLists';
import { supabase, Location } from './lib/supabase';
import { Map, Users, Heart, User, LogOut, Plus } from 'lucide-react';

function App() {
  const { user, profile, loading, signOut } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationCoords, setNewLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showFeed, setShowFeed] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'feed' | 'lists' | 'profile'>('map');

  useEffect(() => {
    if (user) {
      loadLocations();
    }
  }, [user]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleMapClick = (lng: number, lat: number) => {
    setNewLocationCoords({ lat, lng });
    setShowAddLocation(true);
  };

  const handleLocationSelect = async (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (location) {
      setSelectedLocation(location);
    } else {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();
      if (data) setSelectedLocation(data);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐕</span>
          <h1 className="text-xl font-bold text-gray-900">SniffLocal</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:inline">
            {profile?.username || 'User'}
          </span>
          <button
            onClick={signOut}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Sign Out"
          >
            <LogOut size={20} className="text-gray-600" />
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        {activeTab === 'map' && (
          <MapView
            locations={locations}
            onLocationClick={setSelectedLocation}
            onMapClick={handleMapClick}
            selectedLocation={selectedLocation}
          />
        )}

        {activeTab === 'feed' && showFeed && (
          <SocialFeed
            onClose={() => setShowFeed(false)}
            onLocationSelect={handleLocationSelect}
          />
        )}

        {activeTab === 'lists' && showLists && (
          <FavoriteLists
            onClose={() => setShowLists(false)}
            onLocationSelect={handleLocationSelect}
            currentLocation={selectedLocation}
          />
        )}

        {activeTab === 'profile' && showProfile && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setActiveTab('map');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Map size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl">🐕</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile?.display_name || profile?.username}
                  </h3>
                  <p className="text-gray-600">@{profile?.username}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">Account Info</h4>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="text-gray-900">
                      {new Date(profile?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={signOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedLocation && (
          <LocationDetail
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
            onUpdate={loadLocations}
          />
        )}

        {showAddLocation && newLocationCoords && (
          <AddLocationModal
            latitude={newLocationCoords.lat}
            longitude={newLocationCoords.lng}
            onClose={() => {
              setShowAddLocation(false);
              setNewLocationCoords(null);
            }}
            onSuccess={() => {
              loadLocations();
              setShowAddLocation(false);
              setNewLocationCoords(null);
            }}
          />
        )}
      </div>

      <nav className="bg-white border-t flex items-center justify-around py-2 shadow-lg">
        <button
          onClick={() => {
            setActiveTab('map');
            setShowFeed(false);
            setShowLists(false);
            setShowProfile(false);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            activeTab === 'map' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          <Map size={24} />
          <span className="text-xs font-medium">Map</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('feed');
            setShowFeed(true);
            setShowLists(false);
            setShowProfile(false);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            activeTab === 'feed' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          <Users size={24} />
          <span className="text-xs font-medium">Feed</span>
        </button>

        <button
          onClick={() => {
            if (activeTab === 'map') {
              const center = { lat: 39.8283, lng: -98.5795 };
              setNewLocationCoords(center);
              setShowAddLocation(true);
            }
          }}
          className="bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition -mt-6"
        >
          <Plus size={28} />
        </button>

        <button
          onClick={() => {
            setActiveTab('lists');
            setShowFeed(false);
            setShowLists(true);
            setShowProfile(false);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            activeTab === 'lists' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          <Heart size={24} />
          <span className="text-xs font-medium">Lists</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setShowFeed(false);
            setShowLists(false);
            setShowProfile(true);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          <User size={24} />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
