$body = '{"mode":"text-to-video","contentTitle":"Test","contentDescription":"Eine Frau sitzt vor der Kamera","aspectRatio":"9:16","duration":5,"model":"kling-2.6/text-to-video"}'
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3000/api/generate-video" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 35 -UseBasicParsing
  Write-Host "OK:" $r.Content.Substring(0, [Math]::Min(300, $r.Content.Length))
} catch {
  try { $s = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host "FAIL:" $s.ReadToEnd() }
  catch { Write-Host "ERR:" $_.Exception.Message }
}
