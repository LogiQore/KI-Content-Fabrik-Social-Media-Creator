$base = 'E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator'
$dirs = 'src\app\api\formats','src\app\api\project','src\app\api\strategy','src\app\api\generate-image','src\app\api\generate-video','src\app\api\generate-caption','src\app\api\generate-music','src\app\api\poll-task','src\app\api\render','src\app\api\download-zip','src\app\api\open-folder','src\app\api\upload-asset','src\components\phases','src\components\editor','src\components\ui','src\hooks','src\lib','src\types'
foreach ($d in $dirs) {
    $full = Join-Path $base $d
    if (-not (Test-Path $full)) { New-Item -ItemType Directory -Force -Path $full | Out-Null }
}
Write-Host 'OK'
