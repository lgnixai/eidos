# Extension Server Interceptor

This module implements request intercepting for Eidos extension domains.

## Supported Domain Patterns

### 1. sandbox.<spaceId>.eidos.localhost/*

This pattern is used for both sandbox environment and serving script files directly from the database.

**Sandbox HTML Format**: `sandbox.<spaceId>.eidos.localhost/`
**Script File Format**: `sandbox.<spaceId>.eidos.localhost/scriptid.js`

**Examples**:
- `sandbox.my-space.eidos.localhost/` - Returns the sandbox HTML environment
- `sandbox.my-space.eidos.localhost/my-script.js` - Returns the JavaScript code for script with ID "my-script" from space "my-space"
- `sandbox.25-w19.eidos.localhost/data-processor.js` - Returns the JavaScript code for script with ID "data-processor" from space "25-w19"

**Behavior**:
- Extracts the `spaceId` from the subdomain
- For `.js` requests: Extracts the `scriptId` from the pathname (removes leading `/` and trailing `.js`)
- Validates that the script ID doesn't contain `/` (no nested paths)
- Uses injected `getScriptCode` function to fetch script from database
- Returns the script's `code` field as JavaScript with appropriate headers
- Returns 404 if script not found
- Returns 400 if script ID is invalid
- Returns 500 if there's a database error

### 2. <extensionId>.ext.<spaceId>.eidos.localhost/*

This pattern is used for full extension hosting (existing functionality).

**Format**: `<extensionId>.ext.<spaceId>.eidos.localhost/`

**Examples**:
- `myext.ext.25-w19.eidos.localhost/` - Serves the full extension interface
- `myext.ext.25-w19.eidos.localhost/app.js` - Returns the extension's compiled code



## Implementation Details

### ScriptSandboxHandler Integration

The script serving functionality is now integrated into the `ScriptSandboxHandler` class:

- Uses dependency injection pattern with `getScriptCode` function
- Maintains code isolation between sandbox and data access layers
- Supports both sandbox HTML serving and script file serving

### Headers

All JavaScript responses include these headers:
- `Content-Type: text/javascript`
- `Cross-Origin-Embedder-Policy: require-corp`

### Error Handling

- **400 Bad Request**: Invalid script ID (empty or contains `/`)
- **404 Not Found**: Script not found in database
- **500 Internal Server Error**: Database or other system errors, script code provider not configured

### Security Considerations

- Script IDs are validated to prevent path traversal attacks
- Only `.js` files are served from the sandbox domain for script requests
- Cross-origin policies are enforced
- Code access is abstracted through injected function

## Usage Examples

```javascript
// Fetch a script from the sandbox domain
fetch('http://sandbox.my-space.eidos.localhost:13127/my-script.js')
  .then(response => response.text())
  .then(code => {
    // Use the script code
    console.log(code);
  });

// This is automatically handled by the SDK inject script
const module = await import('http://sandbox.my-space.eidos.localhost:13127/my-script.js');
```

## Testing

Run the test file to verify URL matching and script ID extraction:

```bash
node apps/desktop/electron/server/ext-server/test-ext-interceptor.js
```
