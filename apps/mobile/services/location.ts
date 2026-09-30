import * as Location from 'expo-location';

export async function detectCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Location permission is required');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const [place] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  if (!place) {
    throw new Error('Could not determine your city');
  }

  const parts = [place.city || place.subregion, place.region, place.country].filter(Boolean);
  return parts.join(', ');
}
