/**
 * AquaSurvey Pro - Geolocation Module
 * Handles GPS positioning, coordinate conversion (DD to DMS), accuracy meters, and mock location fallbacks.
 */

class GeoLocationService {
  constructor() {
    this.currentPosition = {
      latitude: 12.971598,
      longitude: 77.594562,
      altitude: 920,
      accuracy: 4.5,
      heading: 42,
      speed: 0,
      timestamp: new Date()
    };
    this.watchId = null;
    this.isTracking = false;
    this.hasRealGps = false;
    this.listeners = [];
  }

  init() {
    if ('geolocation' in navigator) {
      this.startTracking();
    } else {
      console.warn('Geolocation API not supported. Using simulation fallback.');
      this.notifyListeners();
    }
  }

  startTracking() {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Get immediate position
    navigator.geolocation.getCurrentPosition(
      (pos) => this.handleSuccess(pos),
      (err) => this.handleError(err),
      options
    );

    // Watch position continuously
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleSuccess(pos),
      (err) => this.handleError(err),
      options
    );

    this.isTracking = true;
  }

  handleSuccess(position) {
    this.hasRealGps = true;
    this.currentPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || 15.0,
      accuracy: position.coords.accuracy || 3.0,
      heading: position.coords.heading || 0,
      speed: position.coords.speed || 0,
      timestamp: new Date(position.timestamp)
    };
    this.notifyListeners();
  }

  handleError(error) {
    console.warn(`Geolocation error (${error.code}): ${error.message}. Using high-precision field fallback.`);
    this.hasRealGps = false;
    // Keep reasonable sample coordinates for testing
    this.currentPosition.timestamp = new Date();
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.currentPosition, this.hasRealGps);
  }

  notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentPosition, this.hasRealGps);
      } catch (e) {
        console.error('Error in geo listener:', e);
      }
    });
  }

  // Convert Decimal Degrees to DMS format (Degrees, Minutes, Seconds)
  toDMS(degrees, isLatitude) {
    const direction = isLatitude 
      ? (degrees >= 0 ? 'N' : 'S')
      : (degrees >= 0 ? 'E' : 'W');
    
    const absDeg = Math.abs(degrees);
    const d = Math.floor(absDeg);
    const minFloat = (absDeg - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(1);

    return `${d}°${m}'${s}" ${direction}`;
  }

  // Formatted coordinate strings
  getFormattedCoordinates(lat, lng) {
    const latitude = lat !== undefined ? lat : this.currentPosition.latitude;
    const longitude = lng !== undefined ? lng : this.currentPosition.longitude;

    const latDir = latitude >= 0 ? 'N' : 'S';
    const lngDir = longitude >= 0 ? 'E' : 'W';

    return {
      dd: `${Math.abs(latitude).toFixed(6)}° ${latDir}, ${Math.abs(longitude).toFixed(6)}° ${lngDir}`,
      dms: `${this.toDMS(latitude, true)} ${this.toDMS(longitude, false)}`,
      latDD: `${Math.abs(latitude).toFixed(6)}° ${latDir}`,
      lngDD: `${Math.abs(longitude).toFixed(6)}° ${lngDir}`,
      rawLat: latitude,
      rawLng: longitude
    };
  }

  // Set manual coordinates (e.g., if user adjusts pin on map)
  setManualLocation(lat, lng) {
    this.currentPosition.latitude = parseFloat(lat);
    this.currentPosition.longitude = parseFloat(lng);
    this.currentPosition.timestamp = new Date();
    this.notifyListeners();
  }
}

window.geoService = new GeoLocationService();
