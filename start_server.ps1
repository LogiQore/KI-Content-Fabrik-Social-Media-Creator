Set-Location "E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator"
$env:KI_LOGFILE = "$env:TEMP\ki_social_media_creator_nextjs.log"
npm run dev 2>&1 | Tee-Object -FilePath $env:KI_LOGFILE
