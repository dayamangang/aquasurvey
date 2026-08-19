/**
 * AquaSurvey Pro - Data Export & Field Report Generator
 * Exports survey records as CSV, JSON, and triggers printable Field Reports with Institutional Metadata.
 */

class ExportService {
  constructor() {}

  // Export all survey records to standard CSV file (ready for Excel/R/GIS)
  exportToCSV(surveys) {
    if (!surveys || surveys.length === 0) {
      alert('No survey records found to export.');
      return;
    }

    const headers = [
      'Survey_ID',
      'Institute_Name',
      'Project_Title',
      'Timestamp_ISO',
      'Date',
      'Time',
      'Station_ID',
      'Waterbody_Type',
      'Surveyor_Name',
      'Latitude_DD',
      'Longitude_DD',
      'Altitude_Meters',
      'GPS_Accuracy_Meters',
      'Water_pH',
      'Water_Temp_C',
      'Dissolved_Oxygen_mg_L',
      'Salinity_ppt',
      'Secchi_Depth_cm',
      'Ammonia_NH3_mg_L',
      'Nitrite_NO2_mg_L',
      'Alkalinity_mg_L_CaCO3',
      'Observed_Species',
      'Fish_Count',
      'Fish_Health_Condition',
      'Survey_Notes'
    ];

    const rows = surveys.map((s) => {
      const p = s.params || {};
      const loc = s.location || {};
      const dateObj = new Date(s.timestamp);

      return [
        `"${s.id}"`,
        `"${(s.instituteName || 'Fisheries Research Institute').replace(/"/g, '""')}"`,
        `"${(s.projectTitle || 'Fishery Water Quality Survey').replace(/"/g, '""')}"`,
        `"${s.timestamp}"`,
        `"${dateObj.toISOString().split('T')[0]}"`,
        `"${dateObj.toTimeString().split(' ')[0]}"`,
        `"${(s.stationId || '').replace(/"/g, '""')}"`,
        `"${(s.waterBody || '').replace(/"/g, '""')}"`,
        `"${(s.surveyor || '').replace(/"/g, '""')}"`,
        loc.latitude !== undefined ? loc.latitude.toFixed(6) : '',
        loc.longitude !== undefined ? loc.longitude.toFixed(6) : '',
        loc.altitude !== undefined ? loc.altitude : '',
        loc.accuracy !== undefined ? loc.accuracy : '',
        p.ph !== undefined ? p.ph.toFixed(2) : '',
        p.temp !== undefined ? p.temp.toFixed(1) : '',
        p.do !== undefined ? p.do.toFixed(2) : '',
        p.salinity !== undefined ? p.salinity.toFixed(2) : '',
        p.secchi !== undefined ? p.secchi : '',
        p.ammonia !== undefined ? p.ammonia.toFixed(2) : '',
        p.nitrite !== undefined ? p.nitrite.toFixed(2) : '',
        p.alkalinity !== undefined ? p.alkalinity : '',
        `"${(s.speciesObserved || '').replace(/"/g, '""')}"`,
        s.fishCount || '',
        `"${(s.fishHealth || '').replace(/"/g, '""')}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `AquaSurvey_Fishery_Log_${new Date().toISOString().split('T')[0]}.csv`;

    this.triggerDownload(blob, filename);
  }

  // Export as structured JSON
  exportToJSON(surveys) {
    if (!surveys || surveys.length === 0) {
      alert('No survey records found to export.');
      return;
    }

    const jsonStr = JSON.stringify(surveys, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const filename = `AquaSurvey_Backup_${Date.now()}.json`;

    this.triggerDownload(blob, filename);
  }

  // Download a single watermarked image
  downloadImage(dataUrl, filename = null) {
    if (!dataUrl) return;
    const name = filename || `AquaSurvey_GeoPhoto_${Date.now()}.png`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate printable field summary report
  generatePrintReport(surveys) {
    window.print();
  }
}

window.exportService = new ExportService();
