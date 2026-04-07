Set-Location "E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator"
$body = '{"projectName":"Test","platforms":["instagram_beitrag"],"audience":"Test","theme":"Test","count":2}'
$r = Invoke-WebRequest -Uri "http://localhost:3000/api/strategy" -Method POST -ContentType "application/json" -Body $body
Write-Host "Status:" $r.StatusCode
Write-Host "Body:" $r.Content
