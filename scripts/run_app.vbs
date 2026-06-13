Option Explicit

Dim WshShell, fso, scriptDir, projectDir, devUrl, backendPid, frontendPid, strComputer, objWMIService, colProcesses, objProcess

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(scriptDir)
devUrl = "http://localhost:5174"

If Not fso.FolderExists(projectDir & "\node_modules") Then
    WScript.Quit 1
End If

If Not fso.FolderExists(projectDir & "\backend\node_modules") Then
    WScript.Quit 1
End If

' Kill any node processes running from this project directory
On Error Resume Next
strComputer = "."
Set objWMIService = GetObject("winmgmts:{impersonationLevel=impersonate}!\\" & strComputer & "\root\cimv2")
Set colProcesses = objWMIService.ExecQuery("SELECT * FROM Win32_Process WHERE Name='node.exe' AND CommandLine LIKE '%" & projectDir & "%'")
For Each objProcess In colProcesses
    objProcess.Terminate()
Next
Set objWMIService = Nothing
On Error Goto 0

WScript.Sleep 1000

WshShell.CurrentDirectory = projectDir

' Start backend (hidden window, style 0)
WshShell.Run "cmd /c title Backend - Meeting App && cd /d """ & projectDir & "\backend"" && npm start", 0, False

WScript.Sleep 2000

' Start frontend (hidden window, style 0)
WshShell.Run "cmd /c title Frontend - Meeting App && cd /d """ & projectDir & """ && npm run dev", 0, False

WScript.Sleep 3000

' Open browser
WshShell.Run devUrl, 1, False

' Keep script alive and wait for user to close app
Dim result
result = WshShell.Popup("Meeting App is running!" & vbCrLf & "Press OK to shut down both backend and front-end.", 0, "Meeting App", 64)

' User clicked OK — kill node processes in this project only
On Error Resume Next
Set objWMIService = GetObject("winmgmts:{impersonationLevel=impersonate}!\\" & strComputer & "\root\cimv2")
Set colProcesses = objWMIService.ExecQuery("SELECT * FROM Win32_Process WHERE Name='node.exe' AND CommandLine LIKE '%" & projectDir & "%'")
For Each objProcess In colProcesses
    objProcess.Terminate()
Next
Set objWMIService = Nothing
On Error Goto 0

Set fso = Nothing
Set WshShell = Nothing
