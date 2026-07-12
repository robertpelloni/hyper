!macro customInstall
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\TormentNexus" "" "Open &TormentNexus here"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\TormentNexus" "Icon" `"$appExe"`
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\TormentNexus\command" "" `"$appExe" "%V"`

  WriteRegStr HKCU "Software\Classes\Directory\shell\TormentNexus" "" "Open &TormentNexus here"
  WriteRegStr HKCU "Software\Classes\Directory\shell\TormentNexus" "Icon" `"$appExe"`
  WriteRegStr HKCU "Software\Classes\Directory\shell\TormentNexus\command" "" `"$appExe" "%V"`

  WriteRegStr HKCU "Software\Classes\Drive\shell\TormentNexus" "" "Open &TormentNexus here"
  WriteRegStr HKCU "Software\Classes\Drive\shell\TormentNexus" "Icon" `"$appExe"`
  WriteRegStr HKCU "Software\Classes\Drive\shell\TormentNexus\command" "" `"$appExe" "%V"`
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\TormentNexus"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\TormentNexus"
  DeleteRegKey HKCU "Software\Classes\Drive\shell\TormentNexus"
!macroend

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customInit
  IfFileExists $LOCALAPPDATA\TormentNexus\Update.exe 0 +2
  nsExec::Exec '"$LOCALAPPDATA\TormentNexus\Update.exe" --uninstall -s'
!macroend
