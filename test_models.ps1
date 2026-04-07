$apiKey = "597a46e930c225a47260a5bbe81a6b10"
$models = @("gpt-5-2","gpt-4o","gemini-3-flash","gemini-2-5-flash","claude-sonnet-4-5","gpt-4o-mini","claude-haiku-4-5","gemini-3-1-pro")
foreach ($m in $models) {
  $body = "{`"model`":`"$m`",`"max_tokens`":50,`"stream`":false,`"messages`":[{`"role`":`"user`",`"content`":`"Say OK`"}]}"
  try {
    $r = Invoke-WebRequest -Uri "https://api.kie.ai/api/v1/chat/completions" -Method POST -ContentType "application/json" -Body $body -Headers @{Authorization="Bearer $apiKey"} -TimeoutSec 15
    Write-Host "OK - $m :" $r.Content.Substring(0,[Math]::Min(150,$r.Content.Length))
  } catch {
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $text = $reader.ReadToEnd()
      Write-Host "FAIL - $m : $text"
    } catch { Write-Host "FAIL - $m : $($_.Exception.Message)" }
  }
}
