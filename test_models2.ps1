$apiKey = "597a46e930c225a47260a5bbe81a6b10"

function TestModel($model) {
  $body = "{`"model`":`"$model`",`"max_tokens`":30,`"stream`":false,`"messages`":[{`"role`":`"user`",`"content`":`"Say: OK`"}]}"
  try {
    $r = Invoke-WebRequest -Uri "https://api.kie.ai/api/v1/chat/completions" `
      -Method POST -ContentType "application/json" -Body $body `
      -Headers @{Authorization="Bearer $apiKey"} -TimeoutSec 20
    return "OK: " + $r.Content.Substring(0, [Math]::Min(100, $r.Content.Length))
  } catch {
    try {
      $s = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      return "FAIL: " + $s.ReadToEnd().Substring(0, 80)
    } catch { return "ERR: " + $_.Exception.Message }
  }
}

$models = @("gpt-5-2", "gpt-4o", "gpt-4o-mini", "gemini-3-flash", "gemini-2-5-flash")
foreach ($m in $models) {
  Write-Host "$m => $(TestModel $m)"
}
