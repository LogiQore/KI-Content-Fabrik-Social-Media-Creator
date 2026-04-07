$body = '{"contentTitle":"Die harmlose Frage, die dich kontrolliert","contentDescription":"Kurzes Video ueber manipulative Fragen die harmlos klingen","platform":"youtube_shorts","audience":"Menschen die sich von anderen kontrolliert fuehlen","theme":"Manipulation durch Fragen","toneOfVoice":"direkt, aufklaerend"}'
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3000/api/generate-caption" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30 -UseBasicParsing
  Write-Host "Status:" $r.StatusCode
  Write-Host $r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
} catch {
  try { $s = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host "FAIL:" $s.ReadToEnd() }
  catch { Write-Host "ERR:" $_.Exception.Message }
}
