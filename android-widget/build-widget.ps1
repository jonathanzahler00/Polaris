# PowerShell script to build the Polaris Android Widget
# Uses Eclipse Adoptium JDK 17 (Gradle requires JDK 17)

$ErrorActionPreference = "Stop"

# JDK 17 – update if you install a different patch version
$JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
# Alternative: Android Studio bundled JDK
# $JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"

Write-Host "Using JAVA_HOME: $JAVA_HOME" -ForegroundColor Green

# Verify Java is available
java -version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Java not found" -ForegroundColor Red
    exit 1
}

Write-Host "`nKeystore already exists: polaris-widget.keystore" -ForegroundColor Green
Write-Host "Password: ***REMOVED***" -ForegroundColor Yellow

# Build the APK
Write-Host "`nBuilding production release APK (prod flavor)..." -ForegroundColor Green
.\gradlew.bat assembleProdRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful!" -ForegroundColor Green
    Write-Host "APK location: app\build\outputs\apk\prod\release\app-prod-release.apk" -ForegroundColor Cyan
    Write-Host "`nTo install on your phone:" -ForegroundColor Yellow
    Write-Host "  1. Copy the APK to your phone"
    Write-Host "  2. Open it and allow installation from unknown sources"
    Write-Host "  3. Install the app"
    Write-Host "  4. Add widget to home screen"
} else {
    Write-Host "`nBuild failed!" -ForegroundColor Red
    exit 1
}
