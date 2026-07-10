Set WshShell = CreateObject("WScript.Shell")

' 1. Silently attempt to kill any existing process on port 3000 to prevent hidden background ghosts
WshShell.Run "cmd.exe /c for /f ""tokens=5"" %a in ('netstat -aon ^| find "":3000""') do taskkill /f /pid %a", 0, True

' 2. Start the AI server completely hidden in the background (0 = hidden)
WshShell.Run "cmd.exe /c npm run start", 0, False

' 3. Wait 3 seconds for the server to fully initialize
WScript.Sleep 3000

' 4. Open Google Chrome pointing to the local server
WshShell.Run "cmd.exe /c start chrome http://localhost:3000", 0, False
