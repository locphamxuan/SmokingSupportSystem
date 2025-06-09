
# Đổi tên tất cả file .js trong src thành .jsx
Get-ChildItem -Recurse -Filter *.js -Path .\src | ForEach-Object {
    $newName = $_.FullName -replace '\.js$', '.jsx'
    Rename-Item $_.FullName $newName
}

# Cập nhật import/export trong toàn bộ file mã nguồn
Get-ChildItem -Recurse -Include *.js,*.jsx,*.ts,*.tsx -Path .\src | ForEach-Object {
    (Get-Content $_.FullName) -replace '(["'']\.\/[^"''\n\r]*)\.js(["''])', '$1$2' | Set-Content $_.FullName
}

Write-Host "✅ Đã đổi tên .js → .jsx và cập nhật import trong toàn bộ src/"
