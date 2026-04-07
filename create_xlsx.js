const XLSX = require('xlsx');
const data = [
  ['platform','label','width','height','aspectRatio','maxDurationSec','format','maxFileSizeMB','notes'],
  ['instagram_beitrag','Instagram Beitrag (Feed)',1080,1080,'1:1',60,'both',100,'Quadratisch; auch 4:5 moeglich'],
  ['instagram_reels','Instagram Reels',1080,1920,'9:16',90,'video',100,'Vertikal; max. 90s'],
  ['tiktok','TikTok',1080,1920,'9:16',600,'video',287,'Vertikal; max. 10 Min'],
  ['youtube_shorts','YouTube Shorts',1080,1920,'9:16',60,'video',256,'Vertikal; max. 60s'],
  ['youtube_video','YouTube Video',1920,1080,'16:9',43200,'video',256,'Horizontal; kein Zeitlimit'],
  ['pinterest','Pinterest Pin',1000,1500,'2:3',900,'both',20,'Vertikal; Videos max. 15 Min'],
  ['linkedin_beitrag','LinkedIn Beitrag',1200,627,'16:9',600,'both',200,'Horizontal; Videos max. 10 Min']
];
const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Formate');
XLSX.writeFile(wb, 'E:/1_CLAUDE_Web_apps/KI_Content_Fabrik_Social_Media_Creator/social_media_formate.xlsx');
console.log('XLSX erstellt');
