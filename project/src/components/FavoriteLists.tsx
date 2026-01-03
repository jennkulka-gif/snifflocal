import { useState, useEffect } from 'react';
import { X, Plus, Heart, MapPin, Trash2 } from 'lucide-react';
import { supabase, FavoriteList, Location } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FavoriteListsProps {
  onClose: () => void;
  onLocationSelect: (locationId: string) => void;
  currentLocation?: Location | null;
}

export function FavoriteLists({ onClose, onLocationSelect, currentLocation }: FavoriteListsProps) {
  const { user } = useAuth();
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [listLocations, setListLocations] = useState<Location[]>([]);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, [user]);

  useEffect(() => {
    if (selectedList) {
      loadListLocations(selectedList);
    }
  }, [selectedList]);

  const loadLists = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorite_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadListLocations = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('list_locations')
        .select(`
          location_id,
          locations (*)
        `)
        .eq('list_id', listId);

      if (error) throw error;
      setListLocations(data?.map((item: any) => item.locations) || []);
    } catch (error) {
      console.error('Error loading list locations:', error);
    }
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorite_lists')
        .insert({
          user_id: user.id,
          name: newListName,
          description: newListDescription.trim() || null,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      setLists([data, ...lists]);
      setNewListName('');
      setNewListDescription('');
      setIsPublic(false);
      setShowNewListForm(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      const { error } = await supabase
        .from('favorite_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      setLists(lists.filter(l => l.id !== listId));
      if (selectedList === listId) {
        setSelectedList(null);
        setListLocations([]);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const addToList = async (listId: string) => {
    if (!currentLocation) return;

    try {
      const { error } = await supabase
        .from('list_locations')
        .insert({
          list_id: listId,
          location_id: currentLocation.id,
        });

      if (error) {
        if (error.code === '23505') {
          alert('This location is already in this list!');
        }
        throw error;
      }

      if (selectedList === listId) {
        await loadListLocations(listId);
      }
      alert('Location added to list!');
    } catch (error) {
      console.error('Error adding to list:', error);
    }
  };

  const removeFromList = async (listId: string, locationId: string) => {
    try {
      const { error } = await supabase
        .from('list_locations')
        .delete()
        .eq('list_id', listId)
        .eq('location_id', locationId);

      if (error) throw error;

      await loadListLocations(listId);
    } catch (error) {
      console.error('Error removing from list:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Favorite Lists</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {currentLocation && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-800 mb-2">
                Add <strong>{currentLocation.name}</strong> to a list:
              </p>
              <div className="flex flex-wrap gap-2">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => addToList(list.id)}
                    className="px-3 py-1 bg-white border border-emerald-300 text-emerald-700 rounded-full text-sm hover:bg-emerald-100 transition"
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            {showNewListForm ? (
              <form onSubmit={createList} className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    List Name
                  </label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Weekend Parks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Describe your list..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this list public
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewListForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Create List
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowNewListForm(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create New List
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">📝</p>
              <p className="text-gray-600">No lists yet. Create your first list!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lists.map((list) => (
                <div key={list.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedList(selectedList === list.id ? null : list.id)}
                    className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="text-emerald-600" size={20} />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{list.name}</p>
                        {list.description && (
                          <p className="text-sm text-gray-600">{list.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                      }}
                      className="p-2 hover:bg-red-100 rounded-full transition text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </button>

                  {selectedList === list.id && (
                    <div className="border-t bg-gray-50 p-4">
                      {listLocations.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No locations in this list yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {listLocations.map((location) => (
                            <div
                              key={location.id}
                              className="bg-white rounded-lg p-3 flex items-center justify-between"
                            >
                              <button
                                onClick={() => {
                                  onLocationSelect(location.id);
                                  onClose();
                                }}
                                className="flex items-center gap-2 text-left flex-1"
                              >
                                <MapPin size={16} className="text-emerald-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{location.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{location.category}</span>
                                    <span>•</span>
                                    <span>⭐ {location.average_rating.toFixed(1)}</span>
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={() => removeFromList(list.id, location.id)}
                                className="p-2 hover:bg-red-100 rounded-full transition text-red-600"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
