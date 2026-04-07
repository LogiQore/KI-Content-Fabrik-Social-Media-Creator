$body = '{"projectName":"Test","platforms":["instagram_beitrag"],"audience":"Fitness","theme":"Oster Kampagne","count":2}'
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3001/api/strategy" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 35
  Write-Host "Status:" $r.StatusCode
  Write-Host $r.Content.Substring(0, [Math]::Min(400, $r.Content.Length))
} catch {
  Write-Host "FAIL:" $_.Exception.Message
}
