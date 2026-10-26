; HereWeHolo Player - uitbreiding van de Windows-installer.
; electron-builder neemt build/installer.nsh vanzelf mee.
;
; Verwijderen via Instellingen > Apps haalde alleen het programma weg. De
; video's, de indeling en de instellingen bleven in %APPDATA% staan, net als
; het browserprofiel van de exe-loze versie. Nu vraagt de uninstaller of die
; ook weg moeten (stil verwijderen met /S kiest Ja).
;
; Bij een update draait de oude uninstaller ook, maar dan met --updated:
; ${isUpdated} is dan waar en er wordt niets aan de gegevens gedaan.

!macro customUnInstall
  ${ifNot} ${isUpdated}
    MessageBox MB_YESNO|MB_ICONQUESTION "Ook alle video's, de indeling en de instellingen van HereWeHolo van deze computer verwijderen?$\r$\n$\r$\nJa: alles gaat weg, ook de map in AppData. Dit kan niet ongedaan worden gemaakt.$\r$\nNee: alleen het programma. Je gegevens blijven staan voor een latere installatie.$\r$\n$\r$\nTip: maak eerst een back-up via het menu, Opslaan en beheer, Alles exporteren." /SD IDYES IDNO hwh_gegevens_bewaren
      ; de gegevens staan altijd bij de gebruiker, ook als de app voor
      ; alle gebruikers is geinstalleerd
      ${if} $installMode == "all"
        SetShellVarContext current
      ${endIf}
      ; video's, indeling, instellingen, logboeken en caches van de Windows-app
      RMDir /r "$APPDATA\HereWeHolo Player"
      RMDir /r "$APPDATA\hereweholo-player"
      ; browserprofiel van de exe-loze versie (Start Holobox.bat)
      RMDir /r "$LOCALAPPDATA\HereWeHolo"
      RMDir /r "$LOCALAPPDATA\hereweholo-player-updater"
      ; een zelf aangemaakte snelkoppeling in Opstarten
      Delete "$SMSTARTUP\HereWeHolo*.lnk"
      ${if} $installMode == "all"
        SetShellVarContext all
      ${endIf}
    hwh_gegevens_bewaren:
  ${endIf}
!macroend
