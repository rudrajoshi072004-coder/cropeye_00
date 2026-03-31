# Source File Hiding Configuration

## ✅ What This Configuration Does

### 1. **Hides Source Files in Network Tab**
- ✅ Generic chunk names: `vendor-react-[hash].js` instead of `react-dom.production.min-[hash].js`
- ✅ No source file paths visible in chunk names
- ✅ All files in `assets/` folder with hashed names

### 2. **Hides Source Files in DevTools**
- ✅ **No Source Maps**: `sourcemap: false` - No `.map` files generated
- ✅ **Obfuscated Code**: Terser minifies and obfuscates variable names
- ✅ **Removed Comments**: All comments stripped from production build
- ✅ **Mangled Names**: Top-level variable names obfuscated

### 3. **Code Splitting with Hidden Structure**
- ✅ Generic chunk names (no component names exposed):
  - `vendor-react-[hash].js` (React, ReactDOM)
  - `vendor-leaflet-[hash].js` (Map libraries)
  - `comp-map-[hash].js` (Map components)
  - `comp-dash-[hash].js` (Dashboard components)
- ✅ No file paths in chunk names

## 🔒 Security Features

### Network Tab
**Before:**
```
assets/react-dom.production.min-abc123.js
assets/src-components-AddFarm-def456.js
```

**After:**
```
assets/vendor-react-abc123.js
assets/comp-map-def456.js
```

### DevTools Sources Tab
**Before:**
- Can see `src/components/Add Farm.tsx`
- Can see source code structure
- Can see variable names

**After:**
- No source files visible
- Only minified/obfuscated code
- Variable names are mangled (a, b, c, etc.)

### Console
**Before:**
- Error stack traces show file paths
- Can see component names

**After:**
- Error stack traces show hashed chunk names only
- No source file references

## 📋 Configuration Details

### Terser Options
```javascript
terserOptions: {
  compress: {
    drop_console: false,  // Set to true to remove ALL console logs
    drop_debugger: true,  // Removes debugger statements
  },
  format: {
    comments: false,      // Removes all comments
  },
  mangle: {
    toplevel: true,       // Obfuscates top-level names
  },
}
```

### Chunk Naming
- Generic names: `vendor-*`, `comp-*`
- Hashed filenames: `[name]-[hash].js`
- No source paths exposed

## 🧪 Testing

After building, check:

1. **Network Tab:**
   - Open DevTools → Network tab
   - Refresh page
   - ✅ Should see generic names like `vendor-react-[hash].js`
   - ❌ Should NOT see `Add Farm.tsx` or file paths

2. **Sources Tab:**
   - Open DevTools → Sources tab
   - ✅ Should NOT see `src/` folder
   - ✅ Only see `dist/assets/` files
   - ✅ Code is minified/obfuscated

3. **Console:**
   - Open DevTools → Console
   - Check any error messages
   - ✅ Should show hashed chunk names
   - ❌ Should NOT show source file paths

## ⚙️ Additional Options

### Remove All Console Logs
Change in `vite.config.ts`:
```javascript
drop_console: true,  // Removes ALL console.* calls
```

### More Aggressive Obfuscation
Add to `terserOptions`:
```javascript
mangle: {
  toplevel: true,
  properties: {
    regex: /^_/,  // Mangle properties starting with _
  },
  keep_classnames: false,  // Obfuscate class names too
  keep_fnames: false,      // Obfuscate function names
},
```

## 📝 Notes

- ✅ Build still works normally
- ✅ Development mode unchanged (only affects production build)
- ✅ Code splitting still works (just with hidden names)
- ✅ Performance maintained (actually improved with better minification)

