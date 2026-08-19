/**
 * AquaSurvey Pro - IndexedDB & Local Storage Manager
 * Stores survey entries, stamped images, GPS telemetry, and water quality parameters locally.
 */

class StorageService {
  constructor() {
    this.dbName = 'AquaSurveyDB';
    this.dbVersion = 1;
    this.storeName = 'surveys';
    this.db = null;
    this.isReady = false;
  }

  async init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to LocalStorage');
        this.isReady = true;
        resolve(false);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('stationId', 'stationId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isReady = true;
        resolve(true);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB open error, using LocalStorage:', event.target.error);
        this.isReady = true;
        resolve(false);
      };
    });
  }

  async saveSurvey(surveyRecord) {
    if (!surveyRecord.id) {
      surveyRecord.id = 'SRV-' + Date.now();
    }
    if (!surveyRecord.timestamp) {
      surveyRecord.timestamp = new Date().toISOString();
    }

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(surveyRecord);

        req.onsuccess = () => resolve(surveyRecord);
        req.onerror = (e) => reject(e.target.error);
      });
    } else {
      // LocalStorage fallback
      const surveys = this.getLocalSurveys();
      const idx = surveys.findIndex((s) => s.id === surveyRecord.id);
      if (idx >= 0) {
        surveys[idx] = surveyRecord;
      } else {
        surveys.unshift(surveyRecord);
      }
      localStorage.setItem('aquasurveys_backup', JSON.stringify(surveys));
      return surveyRecord;
    }
  }

  async getAllSurveys() {
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();

        req.onsuccess = () => {
          let list = req.result || [];
          list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          resolve(list);
        };
        req.onerror = () => resolve(this.getLocalSurveys());
      });
    } else {
      return this.getLocalSurveys();
    }
  }

  async deleteSurvey(id) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
      });
    } else {
      const list = this.getLocalSurveys().filter((s) => s.id !== id);
      localStorage.setItem('aquasurveys_backup', JSON.stringify(list));
      return true;
    }
  }

  async clearAll() {
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.clear().onsuccess = () => resolve(true);
      });
    } else {
      localStorage.removeItem('aquasurveys_backup');
      return true;
    }
  }

  getLocalSurveys() {
    try {
      const data = localStorage.getItem('aquasurveys_backup');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // Populate realistic demonstration field surveys if DB is empty
  async seedDemoDataIfEmpty() {
    const existing = await this.getAllSurveys();
    if (existing && existing.length > 0) return existing;

    const demoSurveys = [
      {
        id: 'SRV-DEMO-001',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        stationId: 'POND-WEST-A1',
        waterBody: 'Earthen Fish Pond',
        surveyor: 'Dr. Sarah Jenkins',
        speciesObserved: 'Labeo rohita (Rohu Carp)',
        fishCount: 420,
        fishHealth: 'High Vitality / Healthy',
        notes: 'Plankton bloom active, dissolved oxygen optimal after morning aerator cycle.',
        location: {
          latitude: 12.971598,
          longitude: 77.594562,
          altitude: 915.2,
          accuracy: 2.8,
          formattedDD: '12.971598° N, 77.594562° E'
        },
        params: {
          ph: 7.4,
          temp: 27.2,
          do: 7.1,
          salinity: 0.3,
          secchi: 38,
          ammonia: 0.04,
          nitrite: 0.01,
          alkalinity: 135
        },
        photoDataUrl: null // Generated or placeholder
      },
      {
        id: 'SRV-DEMO-002',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        stationId: 'RIVER-DELTA-04',
        waterBody: 'Estuarine Mangrove Channel',
        surveyor: 'Dr. Sarah Jenkins',
        speciesObserved: 'Lates calcarifer (Asian Seabass)',
        fishCount: 85,
        fishHealth: 'Active / Juvenile Stage',
        notes: 'Tidal influx bringing saline water. Turbidity elevated due to spring tide.',
        location: {
          latitude: 12.985412,
          longitude: 77.610234,
          altitude: 890.0,
          accuracy: 4.1,
          formattedDD: '12.985412° N, 77.610234° E'
        },
        params: {
          ph: 8.1,
          temp: 29.0,
          do: 5.8,
          salinity: 16.5,
          secchi: 25,
          ammonia: 0.08,
          nitrite: 0.03,
          alkalinity: 160
        },
        photoDataUrl: null
      },
      {
        id: 'SRV-DEMO-003',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        stationId: 'LAKE-NURSERY-B',
        waterBody: 'Freshwater Nursery Reservoir',
        surveyor: 'Alex Rivera',
        speciesObserved: 'Oreochromis niloticus (Tilapia Fry)',
        fishCount: 1200,
        fishHealth: 'Moderate - Acid Alert',
        notes: 'Heavy rainfall caused slight acidification from soil runoff. Monitoring pH closely.',
        location: {
          latitude: 12.955120,
          longitude: 77.578910,
          altitude: 930.5,
          accuracy: 3.5,
          formattedDD: '12.955120° N, 77.578910° E'
        },
        params: {
          ph: 6.2,
          temp: 24.8,
          do: 4.6,
          salinity: 0.1,
          secchi: 55,
          ammonia: 0.15,
          nitrite: 0.06,
          alkalinity: 70
        },
        photoDataUrl: null
      }
    ];

    for (const demo of demoSurveys) {
      await this.saveSurvey(demo);
    }
    return demoSurveys;
  }
}

window.storageService = new StorageService();
