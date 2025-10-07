# PowerShell script to commit each file individually
Write-Host "Starting individual file commits..."

# Get all files recursively
$files = Get-ChildItem -Path "." -Recurse -File | Where-Object { $_.Name -ne "commit-files.ps1" }

Write-Host "Found $($files.Count) files to commit"

foreach ($file in $files) {
    # Get relative path from current directory
    $relativePath = Resolve-Path -Path $file.FullName -Relative
    # Remove the .\ prefix
    $relativePath = $relativePath.Substring(2)
    
    Write-Host "Processing: $relativePath"
    
    # Stage the file
    git add "$relativePath"
    
    # Create commit message
    $commitMessage = "Add $relativePath"
    
    # Commit the file
    git commit -m "$commitMessage"
    
    Write-Host "Committed: $relativePath"
}

Write-Host "All files committed individually!"