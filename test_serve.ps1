Add-Type -AssemblyName System.Web
$imgFile = Get-ChildItem "E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator\tmp\projects" -Recurse | Where-Object { -not $_.PSIsContainer -and $_.Name -notlike "*.json" } | Select-Object -First 1 -ExpandProperty FullName
Write-Host "File: $imgFile"

$relPath = $imgFile.Replace("E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator\", "")
$encoded = [System.Web.HttpUtility]::UrlEncode($relPath)
$url = "http://localhost:3001/api/serve-asset?path=$encoded"
Write-Host "URL: $url"

try {
  $r = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
  Write-Host "OK - Status:" $r.StatusCode "Content-Type:" $r.Headers["Content-Type"] "Bytes:" $r.Content.Length
} catch {
  try { $s = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host "FAIL:" $s.ReadToEnd() }
  catch { Write-Host "ERR:" $_.Exception.Message }
}
