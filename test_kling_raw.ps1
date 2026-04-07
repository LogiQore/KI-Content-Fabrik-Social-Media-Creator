$apiKey = "597a46e930c225a47260a5bbe81a6b10"
$tests = @(
  '{"model":"kling-2.6/text-to-video","input":{"prompt":"A woman sits thoughtfully","aspect_ratio":"9:16","duration":"5","sound":false}}',
  '{"model":"kling-2.6/text-to-video","input":{"prompt":"A woman sits thoughtfully","aspect_ratio":"9:16","duration":"5","mode":"std","negative_prompt":""}}',
  '{"model":"wan-2.6/text-to-video","input":{"prompt":"A woman sits thoughtfully","aspect_ratio":"9:16","duration":"5"}}',
  '{"model":"wan-2.6/text-to-video","input":{"prompt":"A woman sits thoughtfully","negative_prompt":"","aspect_ratio":"9:16","duration":"5"}}'
)
$i = 1
foreach ($b in $tests) {
  try {
    $r = Invoke-WebRequest -Uri "https://api.kie.ai/api/v1/jobs/createTask" -Method POST -ContentType "application/json" -Body $b -Headers @{Authorization="Bearer $apiKey"} -TimeoutSec 15 -UseBasicParsing
    Write-Host "Test $i OK:" $r.Content.Substring(0, [Math]::Min(120, $r.Content.Length))
  } catch {
    try { $s = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host "Test $i FAIL:" $s.ReadToEnd() }
    catch { Write-Host "Test $i ERR:" $_.Exception.Message }
  }
  $i++
}
