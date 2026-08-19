/**
 * AquaSurvey Pro - Interactive Field Map
 * Integrates Leaflet.js for survey site mapping, water quality health pins, and coordinate fine-tuning.
 */

class SurveyMapController {
  constructor() {
    this.map = null;
    this.currentLocationMarker = null;
    this.surveyMarkersLayer = null;
    this.isInitialized = false;
  }

  init(containerId = 'fisherySurveyMap') {
    const el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined') {
      console.warn('Leaflet or map container not ready');
      return;
    }

    if (this.isInitialized) return;

    const defaultLat = 12.971598;
    const defaultLng = 77.594562;

    this.map = L.map(containerId, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: true
    });

    // High quality OpenStreetMap tiles with dark/oceanic styling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | AquaSurvey Pro'
    }).addTo(this.map);

    this.surveyMarkersLayer = L.layerGroup().addTo(this.map);

    // Current location marker with pulsating blue circle
    this.currentLocationMarker = L.circleMarker([defaultLat, defaultLng], {
      radius: 9,
      fillColor: '#00d4ff',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(this.map);

    this.currentLocationMarker.bindTooltip('Current Field Location', { permanent: false, direction: 'top' });

    // Allow user to click map to adjust field location
    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (window.geoService) {
        window.geoService.setManualLocation(lat, lng);
        if (window.app) {
          window.app.showToast(`📍 Location updated to ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`, 'info');
        }
      }
    });

    this.isInitialized = true;
    this.refreshMapSize();
  }

  updateCurrentPosition(lat, lng) {
    if (!this.map || !this.currentLocationMarker) return;
    this.currentLocationMarker.setLatLng([lat, lng]);
  }

  centerOnCurrent() {
    if (!this.map || !window.geoService) return;
    const pos = window.geoService.currentPosition;
    this.map.setView([pos.latitude, pos.longitude], 15);
  }

  refreshMapSize() {
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 250);
    }
  }

  // Render all survey station pins on the map
  renderSurveyMarkers(surveys) {
    if (!this.map || !this.surveyMarkersLayer) return;
    this.surveyMarkersLayer.clearLayers();

    if (!surveys || surveys.length === 0) return;

    const bounds = [];

    surveys.forEach((survey) => {
      if (!survey.location || !survey.location.latitude) return;

      const lat = survey.location.latitude;
      const lng = survey.location.longitude;
      bounds.push([lat, lng]);

      const ph = survey.params ? survey.params.ph : 7.5;
      const doVal = survey.params ? survey.params.do : 6.5;

      // Color coding pin based on water quality
      let pinColor = '#10b981'; // Green Optimal
      if (ph < 6.0 || ph > 8.5 || doVal < 3.0) {
        pinColor = '#ef4444'; // Red Critical
      } else if (ph < 6.5 || doVal < 5.0) {
        pinColor = '#f59e0b'; // Yellow Warning
      }

      // Custom SVG Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-survey-pin',
        html: `
          <div style="
            background: ${pinColor};
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 11px;
              color: #060e1a;
              font-weight: 800;
            ">🐟</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const dateStr = new Date(survey.timestamp).toLocaleString();
      const p = survey.params || {};

      const popupContent = `
        <div class="map-popup-card">
          <div class="map-popup-title">${survey.stationId || 'Survey Station'}</div>
          <div style="font-size: 0.76rem; color: #8ba2c0;">${survey.waterBody || 'Waterbody'} • ${dateStr}</div>
          <div class="map-popup-params">
            <span>💧 pH: <b>${p.ph ? p.ph.toFixed(1) : '--'}</b></span>
            <span>🌡️ <b>${p.temp ? p.temp.toFixed(1) : '--'}°C</b></span>
            <span>🫁 DO: <b>${p.do ? p.do.toFixed(1) : '--'}mg/L</b></span>
          </div>
          ${survey.speciesObserved ? `<div style="font-size: 0.75rem; color: #00f5d4;">🐟 ${survey.speciesObserved} (${survey.fishCount || 0} count)</div>` : ''}
          ${survey.photoDataUrl ? `<img src="${survey.photoDataUrl}" class="map-popup-img" alt="Survey Photo">` : ''}
          <button class="btn btn-primary btn-sm" style="margin-top: 0.4rem; width: 100%;" onclick="window.app.viewSurveyDetail('${survey.id}')">View Full Record</button>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.surveyMarkersLayer.addLayer(marker);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }
}

window.surveyMapController = new SurveyMapController();
