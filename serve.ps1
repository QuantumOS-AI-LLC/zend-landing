$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
Write-Host 'Server running on http://localhost:8080/'

register-engineevent -sourceidentifier ([System.Management.Automation.PsEngineEvent]::Exiting) -action {
    $listener.Stop()
    $listener.Close()
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url.LocalPath
        
        if ($url -eq '/api/leads' -and $request.HttpMethod -eq 'POST') {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $body = $reader.ReadToEnd()
            
            try {
                $json = ConvertFrom-Json $body
                
                Write-Host ''
                Write-Host '========================================================' -ForegroundColor Yellow
                Write-Host '📥 [POWERSHELL GATEWAY: LEAD CAPTURED]' -ForegroundColor Green
                Write-Host "  Name:     $($json.name)" -ForegroundColor White
                Write-Host "  Business: $($json.business)" -ForegroundColor White
                Write-Host "  Phone:    $($json.phone)" -ForegroundColor White
                Write-Host "  Email:    $($json.email)" -ForegroundColor White
                Write-Host "  Volume:   $($json.volume)" -ForegroundColor White
                Write-Host "  Ticket:   $($json.ticketSize)" -ForegroundColor White
                Write-Host "  Savings:  $($json.savings)" -ForegroundColor White
                Write-Host '========================================================' -ForegroundColor Yellow
                Write-Host ''
                
                $response.StatusCode = 200
                $response.ContentType = 'application/json'
                $resBody = '{"success":true,"mode":"powershell_sandbox","message":"Lead logged in PowerShell."}'
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($resBody)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } catch {
                $response.StatusCode = 400
                $buffer = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"Invalid JSON payload."}')
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        } else {
            if ($url -eq '/') { $url = '/index.html' }
            
            $cleanUrl = $url.TrimStart('/')
            $localPath = [System.IO.Path]::Combine((Get-Location).Path, $cleanUrl)
            
            if (Test-Path $localPath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                
                if ($url.EndsWith('.html')) { $response.ContentType = 'text/html; charset=utf-8' }
                elseif ($url.EndsWith('.css')) { $response.ContentType = 'text/css' }
                elseif ($url.EndsWith('.js')) { $response.ContentType = 'application/javascript' }
                elseif ($url.EndsWith('.png')) { $response.ContentType = 'image/png' }
                
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $buffer = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
