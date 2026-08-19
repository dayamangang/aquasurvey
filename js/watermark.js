/**
 * AquaSurvey Pro - Standard Scientific Photo Watermark
 * One consistent watermark is applied automatically to every survey photograph.
 * Developer names are intentionally excluded.
 */
class WatermarkEngine {
  constructor() {
    this.icarLogo = new Image();
    this.icarLogo.src = 'assets/icar_logo.png';
  }

  setStyle() { /* Kept for backward compatibility; only one style is supported. */ }

  stamp(sourceImage, geoData = {}, surveyData = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    const lat = Number.isFinite(Number(geoData.latitude)) ? Number(geoData.latitude) : 0;
    const lng = Number.isFinite(Number(geoData.longitude)) ? Number(geoData.longitude) : 0;
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    const coord = `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
    const date = geoData.timestamp ? new Date(geoData.timestamp) : new Date();
    const dateTime = date.toLocaleString([], { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const station = surveyData.stationId || 'Field Station';
    const waterBody = surveyData.waterBody || 'Waterbody';
    const surveyor = surveyData.surveyor || 'Surveyor';
    const institute = surveyData.instituteName || 'ICAR Research Complex for NEH Region';
    const p = surveyData.params || {};
    const ph = Number(p.ph); const temp = Number(p.temp); const oxygen = Number(p.do); const sal = Number(p.salinity);

    const scale = Math.max(0.75, canvas.width / 1280);
    const bannerH = Math.max(150, Math.round(canvas.height * 0.19));
    const y = canvas.height - bannerH;
    const pad = Math.round(24 * scale);

    const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
    grad.addColorStop(0, 'rgba(4,14,28,0.78)');
    grad.addColorStop(0.28, 'rgba(4,14,28,0.94)');
    grad.addColorStop(1, 'rgba(3,9,18,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, canvas.width, bannerH);

    const accent = ctx.createLinearGradient(0, y, canvas.width, y);
    accent.addColorStop(0, '#0088ff'); accent.addColorStop(0.5, '#00d4ff'); accent.addColorStop(1, '#00f5d4');
    ctx.fillStyle = accent;
    ctx.fillRect(0, y, canvas.width, Math.max(3, Math.round(4 * scale)));

    let x = pad;
    const logoW = Math.round(38 * scale); const logoH = Math.round(46 * scale);
    if (this.icarLogo.complete && this.icarLogo.naturalWidth > 0) {
      ctx.fillStyle = '#fff'; this.roundRect(ctx, x, y + Math.round(14*scale), logoW, logoH, 5*scale, true, false);
      ctx.drawImage(this.icarLogo, x+3, y+Math.round(17*scale), logoW-6, logoH-6);
      x += logoW + Math.round(12*scale);
    }

    ctx.textAlign='left';
    ctx.fillStyle='#00d4ff'; ctx.font=`800 ${Math.round(18*scale)}px Outfit, sans-serif`;
    ctx.fillText('AquaSurvey Pro', x, y + Math.round(31*scale));
    ctx.fillStyle='#dce8f5'; ctx.font=`600 ${Math.round(12*scale)}px Outfit, sans-serif`;
    ctx.fillText(`${institute}  •  ${station}`, x, y + Math.round(49*scale));

    ctx.fillStyle='#ffffff'; ctx.font=`700 ${Math.round(13*scale)}px JetBrains Mono, monospace`;
    ctx.fillText(`GPS  ${coord}   |   Alt ${Number(geoData.altitude || 0).toFixed(1)} m   |   ±${Number(geoData.accuracy || 0).toFixed(1)} m`, pad, y + Math.round(78*scale));

    ctx.fillStyle='#aabbd0'; ctx.font=`500 ${Math.round(11*scale)}px JetBrains Mono, monospace`;
    ctx.fillText(`Station: ${station}   |   ${waterBody}   |   ${dateTime}   |   Surveyor: ${surveyor}`, pad, y + Math.round(98*scale));

    ctx.fillStyle='rgba(0,212,255,0.13)'; ctx.strokeStyle='rgba(0,212,255,0.35)'; ctx.lineWidth=1;
    const pillY=y+Math.round(111*scale); const pillH=Math.round(27*scale);
    this.roundRect(ctx,pad,pillY,canvas.width-pad*2,pillH,6*scale,true,true);
    ctx.fillStyle='#00f5d4'; ctx.font=`700 ${Math.round(12*scale)}px JetBrains Mono, monospace`;
    const val=(n,unit,dec)=>Number.isFinite(n)?n.toFixed(dec)+unit:'--';
    ctx.fillText(`pH ${val(ph,'',1)}   |   Water Temp ${val(temp,' °C',1)}   |   DO ${val(oxygen,' mg/L',1)}   |   Salinity ${val(sal,' ppt',1)}`, pad+Math.round(12*scale), pillY+Math.round(18*scale));

    return canvas;
  }

  roundRect(ctx,x,y,w,h,r,fill,stroke){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
    if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }
}
window.watermarkEngine = new WatermarkEngine();
