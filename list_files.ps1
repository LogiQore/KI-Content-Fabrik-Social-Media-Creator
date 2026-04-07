Get-ChildItem "E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator\tmp\projects" -Recurse | Where-Object { -not $_.PSIsContainer } | Select-Object FullName, Length | Format-Table -AutoSize
