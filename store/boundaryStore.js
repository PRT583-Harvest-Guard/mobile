import { create } from 'zustand'
import { saveBoundaryData, getBoundaryData } from '../services/BoundaryService'

const useBoundaryStore = create((set, get) => ({
  // State
  photos: [],
  boundaryPoints: [],
  existingPoints: [],
  isSaving: false,
  error: null,
  farmId: null,

  // Actions
  setFarmId: (id) => set({ farmId: id }),

  setPhotos: (photos) => set({ photos }),

  addPhoto: (photo, location) => {
    // Ensure location is an object and has the required properties
    if (!location || typeof location !== 'object') {
      console.error('Invalid location object:', location);
      return;
    }

    // Handle both location.coords and direct location object
    const coords = location.coords || location;
    if (!coords || typeof coords !== 'object' || !('latitude' in coords) || !('longitude' in coords)) {
      console.error('Invalid coordinates:', coords);
      return;
    }

    const newPoint = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: new Date().toISOString(),
    };

    const photoWithLocation = {
      uri: photo.uri,
      location: newPoint,
      timestamp: newPoint.timestamp,
    };

    set(state => ({
      photos: [...state.photos, photoWithLocation],
      boundaryPoints: [...state.boundaryPoints, newPoint],
    }));
  },

  savePoint: async (point) => {
    const { farmId, photos } = get();
    if (!farmId) return;

    set({ isSaving: true, error: null });
    try {
      // Instead of saving just one point, save all points including the new one
      // This ensures we're not creating duplicates
      const allPoints = [...photos, {
        uri: point.uri || '',
        location: point,
        timestamp: point.timestamp || new Date().toISOString(),
      }];
      
      await saveBoundaryData(farmId, allPoints.map(p => ({
        latitude: p.location.latitude,
        longitude: p.location.longitude,
        description: p.description || "",
        photoUri: p.uri || null
      })));
      
      // Update the local state with the latest from the database
      const updatedPoints = await getBoundaryData(farmId);
      if (updatedPoints && Array.isArray(updatedPoints)) {
        set({ existingPoints: updatedPoints });
      }
    } catch (error) {
      console.error('Error saving boundary point:', error);
      set({ error: 'Failed to save boundary point' });
    } finally {
      set({ isSaving: false });
    }
  },

  loadExistingPoints: async (farmId) => {
    if (!farmId) return;
    
    set({ isSaving: true, error: null, farmId });
    try {
      const points = await getBoundaryData(farmId);
      if (points && Array.isArray(points)) {
        set({ existingPoints: points });
      }
    } catch (error) {
      console.error('Error loading existing points:', error);
      set({ error: 'Failed to load existing points' });
    } finally {
      set({ isSaving: false });
    }
  },

  clearPoints: () => {
    set({
      photos: [],
      boundaryPoints: [],
      existingPoints: [],
      error: null,
    });
  },

  // Selectors
  getPointCount: () => get().boundaryPoints.length,
  getExistingPointCount: () => get().existingPoints.length,
  getPhotoCount: () => get().photos.length,
  getLatestPoint: () => {
    const points = get().boundaryPoints;
    return points.length > 0 ? points[points.length - 1] : null;
  },
}));

export default useBoundaryStore;
