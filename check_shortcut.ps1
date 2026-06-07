$sc = (New-Object -ComObject WScript.Shell).CreateShortcut('C:\Users\PARS PELET\Desktop\Hermes.lnk')
Write-Host "TargetPath: $($sc.TargetPath)"
Write-Host "Arguments: $($sc.Arguments)"
Write-Host "WorkingDirectory: $($sc.WorkingDirectory)"