# Data Analysis Scripts

This directory contains Node.js scripts for analyzing and processing verb data. These scripts were moved from the `src/` directory to prevent them from being included in the client-side bundle.

## Scripts

### criticalVerbCategories.js
Analyzes verb database to identify critical categories with 0-2 verbs available. This helps identify gaps in the database that need to be filled.

```bash
node scripts/data-analysis/criticalVerbCategories.js
```

### verifyVerbAvailability.js
Verifies that all grammar combinations (level, mood, tense, verb type, dialect) have sufficient verbs available for practice. Reports categories with insufficient coverage.

```bash
node scripts/data-analysis/verifyVerbAvailability.js
```

### finalVerbCheck.js
Performs a final comprehensive check of verb forms across all categories, providing detailed statistics and identifying problematic areas.

```bash
node scripts/data-analysis/finalVerbCheck.js
```

### addCommonVerbs.js
Adds common verbs from the commonVerbs.js data file to the main verbs.js database. This is a data processing script that should be run when adding new verb sets.

```bash
node scripts/data-analysis/addCommonVerbs.js
```

## Dependencies

These scripts use Node.js file system operations (`fs`, `path`, `url`) and should **never** be imported by client-side code as they will break in browsers.

## Usage Notes

- These are build-time analysis tools, not runtime application code
- They directly read and analyze the verb database files
- Results are logged to console for manual review
- Some scripts may modify data files (like addCommonVerbs.js)