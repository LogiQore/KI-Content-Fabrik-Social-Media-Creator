$body = '{"contentTitle":"Oster Workout","contentDescription":"Motivierendes Fitness-Bild fuer Ostern","platform":"instagram_beitrag","aspectRatio":"1:1","model":"seedream/4.5-text-to-image"}'
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3001/api/generate-image" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30 -UseBasicParsing
  Write-Host "Status:" $r.StatusCode
  Write-Host $r.Content.Substring(0, [Math]::Min(400, $r.Content.Length))
} catch {
  try {
    $s = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host "FAIL:" $s.ReadToEnd()
  } catch { Write-Host "ERR:" $_.Exception.Message }
}
