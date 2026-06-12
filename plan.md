# Naming Consistency Plan

This document outlines the naming inconsistencies in the application that need to be fixed to ensure all names are in English and follow TitleCase convention.

## Files to be Modified

Based on the requirements, we will modify files excluding:
1. Files in the `lib` folder
2. Files in the `files` folder
3. Files in the `data` folder
4. Files in folders that don't contain code written by the user

This means we'll focus on:
- Root level JS files (app.js, server.js, FileCache.js, logger.js)
- Files in the `public` folder (HTML, CSS, JS)
- Files in the `public/views` folder

## Naming Inconsistencies Found

### 1. Language Inconsistencies (Portuguese to English)

#### Root Level Files
- `FileCache.js` - Contains Portuguese comments and variable names
- `logger.js` - Contains Portuguese comments
- `config.json` - Contains Portuguese role names in the login section

#### Public Folder Files
- `index.html` - Contains Portuguese text in comments and UI elements
- `index.js` - Contains Portuguese variable names and UI text
- `app.html` - Contains Portuguese in lang attribute
- `app.js` - Contains Portuguese variable names and comments
- `documents.html` - Likely contains Portuguese text
- `minicalc.html` - Likely contains Portuguese text

#### View Files
- `cadastro` - Portuguese word meaning "registration"
- `coordenador` - Portuguese word meaning "coordinator"
- `educador` - Portuguese word meaning "educator"
- `secretaria` - Portuguese word meaning "secretary/reception"
- `upload` - Already in English

### 2. Case Inconsistencies (TitleCase)

#### File Names
- `app.js` - Should be `App.js`
- `FileCache.js` - Should be `FileCache.js` (already correct)
- `logger.js` - Should be `Logger.js`
- `server.js` - Should be `Server.js`
- `index.js` - Should be `Index.js`
- `app.js` (in public) - Should be `App.js`
- View files:
  - `cadastro` - Should be `Cadastro` or `Registration`
  - `coordenador` - Should be `Coordenador` or `Coordinator`
  - `educador` - Should be `Educador` or `Educator`
  - `home` - Should be `Home`
  - `secretaria` - Should be `Secretaria` or `Secretary`
  - `upload` - Should be `Upload`

#### Variable Names
- In `app.js`: `filseService` should be `FileService`
- In `app.js`: `clearLoginEntries` should be `ClearLoginEntries`
- In `app.js`: `readXLSX` should be `ReadXLSX`
- In `app.js`: `writeXLSX` should be `WriteXLSX`
- In `app.js`: `writeWorkbook` should be `WriteWorkbook`
- In `app.js`: `pooling` should be `Pooling`
- In `app.js`: `processarContratos` should be `ProcessContracts`
- In `app.js`: `gerarResumoMes` should be `GenerateMonthSummary`
- In `app.js`: `criarEstruturaResumo` should be `CreateSummaryStructure`
- In `app.js`: `contabilizarSituacao` should be `AccountSituation`
- In `app.js`: `contabilizarVerificacao` should be `AccountVerification`
- In `app.js`: `excelDateToJSDate` should be `ExcelDateToJSDate`
- In `app.js`: `estaConcluido` should be `IsCompleted`

#### Function Names
- In `server.js`: `clearLoginEntries` should be `ClearLoginEntries`
- In `server.js`: `readXLSX` should be `ReadXLSX`
- In `server.js`: `pooling` should be `Pooling`

#### UI Text
- All UI text in HTML and JS files needs to be checked for consistency

## Detailed List of Changes Required

### 1. File Name Changes

#### Root Directory
- `app.js` → `App.js`
- `FileCache.js` → `FileCache.js` (already correct)
- `logger.js` → `Logger.js`
- `server.js` → `Server.js`

#### Public Directory
- `index.js` → `Index.js`
- `app.js` (in public folder) → `App.js`

#### Public/Views Directory
- `cadastro` → `Registration` (or `Cadastro`)
- `coordenador` → `Coordinator` (or `Coordenador`)
- `educador` → `Educator` (or `Educador`)
- `home` → `Home`
- `secretaria` → `Secretary` (or `Secretaria`)
- `upload` → `Upload` (already correct)

### 2. Variable and Function Name Changes

#### In `app.js` (to be renamed to `App.js`)
- `filseService` → `FileService`
- `clearLoginEntries` → `ClearLoginEntries`
- `readXLSX` → `ReadXLSX`
- `writeXLSX` → `WriteXLSX`
- `writeWorkbook` → `WriteWorkbook`
- `pooling` → `Pooling`
- `processarContratos` → `ProcessContracts`
- `gerarResumoMes` → `GenerateMonthSummary`
- `criarEstruturaResumo` → `CreateSummaryStructure`
- `contabilizarSituacao` → `AccountSituation`
- `contabilizarVerificacao` → `AccountVerification`
- `excelDateToJSDate` → `ExcelDateToJSDate`
- `estaConcluido` → `IsCompleted`

#### In `server.js` (to be renamed to `Server.js`)
- Update all references to renamed functions from `App.js`
- `clearLoginEntries` → `ClearLoginEntries`
- `readXLSX` → `ReadXLSX`
- `pooling` → `Pooling`

#### In `FileCache.js` (to be renamed to `FileCache.js`)
- Class names are already properly capitalized

#### In `logger.js` (to be renamed to `Logger.js`)
- No function names to change, but comments should be translated to English

#### In `public/index.js` (to be renamed to `Index.js`)
- Translate Portuguese variable names and UI text to English
- `verSenha` → `showPassword`
- UI text in alert messages and button labels

#### In `public/app.js` (to be renamed to `App.js`)
- Translate Portuguese variable names and comments to English
- `appURL` (keep as is)
- `appStatus` (keep as is)
- Update references to renamed functions

### 3. UI Text and Comments Translation

#### In HTML Files
- Translate Portuguese text in comments to English
- Translate Portuguese UI text to English
- `index.html`: "Acompanhamento Pedagógico" → "Educational Tracking"
- `index.html`: "Usuário" → "User"
- `index.html`: "Senha" → "Password"
- `index.html`: "Ver senha" → "Show password"
- `index.html`: "Entrar" → "Login"

#### In JavaScript Files
- Translate Portuguese comments to English
- Translate Portuguese console messages and alert text
- Translate Portuguese UI text in template literals

#### In View Files
- Translate Portuguese text in comments to English
- Translate Portuguese UI text to English
- `cadastro` view: Translate any Portuguese text
- `home` view: "Acompanhamento" → "Tracking"
- `home` view: "Em dias" → "On track"
- `home` view: "Atrasados" → "Late"
- `home` view: "Muitos Atrasados" → "Very Late"
- `home` view: "Adiantados" → "Ahead"
- `home` view: "Muito Adiantados" → "Very Ahead"
- `home` view: "PROGRESSO MENSAL" → "MONTHLY PROGRESS"
- `home` view: "últimos 60 dias" → "last 60 days"

#### In Configuration Files
- `config.json`: Translate role names from Portuguese to English
- "COORDENADOR" → "COORDINATOR"
- "SECRETARIA" → "SECRETARY"
- "JORGE SOUZA" → "JORGE SOUZA" (proper name, keep as is)
- "EDMUNDO SANTOS" → "EDMUNDO SANTOS" (proper name, keep as is)
- "JOICE LOPES" → "JOICE LOPES" (proper name, keep as is)
- "EDILEUSA CHAVES" → "EDILEUSA CHAVES" (proper name, keep as is)
- "NUBIA CARVALHO" → "NUBIA CARVALHO" (proper name, keep as is)
- "TANIA ANJOS" → "TANIA ANJOS" (proper name, keep as is)

### 4. References and Imports Update

After renaming files and functions, all references and imports must be updated:

#### In `Server.js` (formerly `server.js`)
- Update imports from `./App` instead of `./app`
- Update destructuring assignments to use new function names

#### In `App.js` (formerly `app.js`)
- Update exports to use new function names

#### In `public/Index.js` (formerly `index.js`)
- Update fetch URLs if needed

#### In `public/App.js` (formerly `public/app.js`)
- Update references to renamed functions and variables

## Implementation Order

1. **First Phase - File Renaming**
   - Rename files to follow TitleCase
   - Update import/require statements immediately after each rename

2. **Second Phase - Code Translation**
   - Translate Portuguese comments to English
   - Translate Portuguese UI text to English
   - Translate Portuguese variable names to English

3. **Third Phase - Consistent Naming**
   - Ensure all function and variable names follow TitleCase
   - Update all references to renamed functions/variables

4. **Fourth Phase - Verification**
   - Test application functionality
   - Verify all references are correctly updated
   - Check for any missed translations or naming inconsistencies

## Verification Steps

1. Application should compile without errors
2. All pages should load correctly
3. Authentication should work with new role names
4. Data processing functions should work correctly
5. UI should display English text throughout
6. All functionality should remain intact after changes