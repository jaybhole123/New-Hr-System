  import { useState, useCallback } from 'react';

/**
 * Custom hook to securely fetch and reverse geocode the user's current location.
 * Implements high accuracy, retry logic, and fallback for Nominatim OpenStreetMap.
 */
export const useCurrentLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getReverseGeocoding = async (lat, lon) => {
    try {
      // Use Nominatim OpenStreetMap for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      if (!response.ok) throw new Error('Geocoding network error');
      
      const data = await response.json();
      const addressObj = data.address || {};
      
      return {
        address: data.display_name || 'Address not found',
        city: addressObj.city || addressObj.town || addressObj.village || '',
        state: addressObj.state || '',
        country: addressObj.country || '',
        pincode: addressObj.postcode || ''
      };
    } catch (err) {
      console.error('Reverse Geocoding Failed:', err);
      return {
        address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        city: '',
        state: '',
        country: '',
        pincode: ''
      };
    }
  };

  const fetchPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const refreshLocation = useCallback(async (retries = 3) => {
    setLoading(true);
    setError(null);

    let attempt = 0;
    while (attempt < retries) {
      try {
        const position = await fetchPosition();
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp).toISOString();

        // Check if accuracy is acceptable (less than or equal to 150 meters)
        if (accuracy > 150 && attempt < retries - 1) {
          attempt++;
          // Wait briefly before retrying
          await new Promise(res => setTimeout(res, 2000));
          continue;
        }

        // Fetch reverse geocoded data
        const geocodeData = await getReverseGeocoding(latitude, longitude);

        setLocation({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp,
          ...geocodeData
        });
        
        if (accuracy > 150) {
           setError('Your GPS accuracy is low. Please move to an open area and try again.');
        }

        setLoading(false);
        return; // Success, exit loop
      } catch (err) {
        let errorMsg = 'An unknown error occurred while fetching location.';
        if (err.code === 1) {
          errorMsg = 'Location permission is required to mark attendance.';
          attempt = retries; // Stop retrying on permission denied
        } else if (err.code === 2) {
          errorMsg = 'GPS is unavailable or disabled. Please enable Location Services.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Please check your GPS signal.';
        } else {
           errorMsg = err.message || errorMsg;
        }

        attempt++;
        if (attempt >= retries) {
          setError(errorMsg);
          setLocation(null);
          setLoading(false);
          return;
        }
        await new Promise(res => setTimeout(res, 1000)); // wait before retry
      }
    }
  }, []);

  return { location, loading, error, refreshLocation };
};
