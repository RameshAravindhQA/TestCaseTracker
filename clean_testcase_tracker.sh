#!/bin/bash

echo "🗂️ Organizing TestCaseTracker folder structure..."

# Create organized directory structure
mkdir -p organized_testcase_tracker/{docs,assets,scripts,config}

# Move documentation files
echo "📄 Moving documentation files..."
mv TestCaseTracker/TestCaseTracker/DATABASE_SETUP.md organized_testcase_tracker/docs/
mv TestCaseTracker/TestCaseTracker/DEPENDENCIES.md organized_testcase_tracker/docs/
mv TestCaseTracker/TestCaseTracker/QUICK_START.md organized_testcase_tracker/docs/
mv TestCaseTracker/TestCaseTracker/README.md organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/SETUP_GUIDE.md organized_testcase_tracker/docs/
mv TestCaseTracker/TestCaseTracker/workflow_instructions.md organized_testcase_tracker/docs/

# Move script files
echo "🔧 Moving script files..."
mv TestCaseTracker/TestCaseTracker/replit_run.sh organized_testcase_tracker/scripts/
mv TestCaseTracker/TestCaseTracker/restart_server.sh organized_testcase_tracker/scripts/
mv TestCaseTracker/TestCaseTracker/run.sh organized_testcase_tracker/scripts/
mv TestCaseTracker/TestCaseTracker/server_start.js organized_testcase_tracker/scripts/
mv TestCaseTracker/TestCaseTracker/start_app.sh organized_testcase_tracker/scripts/
mv TestCaseTracker/TestCaseTracker/start.sh organized_testcase_tracker/scripts/

# Move configuration files
echo "⚙️ Moving configuration files..."
mv TestCaseTracker/TestCaseTracker/components.json organized_testcase_tracker/config/
mv TestCaseTracker/TestCaseTracker/drizzle.config.ts organized_testcase_tracker/config/
mv TestCaseTracker/TestCaseTracker/postcss.config.js organized_testcase_tracker/config/
mv TestCaseTracker/TestCaseTracker/tailwind.config.ts organized_testcase_tracker/config/
mv TestCaseTracker/TestCaseTracker/tsconfig.json organized_testcase_tracker/config/
mv TestCaseTracker/TestCaseTracker/vite.config.ts organized_testcase_tracker/config/
mv TestCaseTracker/TestCaseTracker/vitest.config.ts organized_testcase_tracker/config/

# Move assets
echo "🖼️ Moving assets..."
mv TestCaseTracker/TestCaseTracker/attached_assets organized_testcase_tracker/assets/
mv TestCaseTracker/TestCaseTracker/static organized_testcase_tracker/assets/
mv TestCaseTracker/TestCaseTracker/templates organized_testcase_tracker/assets/

# Move core project files
echo "📦 Moving core project files..."
mv TestCaseTracker/TestCaseTracker/package.json organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/package-lock.json organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/client organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/server organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/shared organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/db organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/uploads organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/node_modules organized_testcase_tracker/

# Move remaining files
echo "📋 Moving remaining files..."
mv TestCaseTracker/TestCaseTracker/replit.md organized_testcase_tracker/
mv TestCaseTracker/TestCaseTracker/RegistrationTestCases.csv organized_testcase_tracker/

# Create symbolic links for configuration files that need to be in root
echo "🔗 Creating symbolic links for configuration files..."
cd organized_testcase_tracker
ln -s config/components.json ./components.json
ln -s config/drizzle.config.ts ./drizzle.config.ts
ln -s config/postcss.config.js ./postcss.config.js
ln -s config/tailwind.config.ts ./tailwind.config.ts
ln -s config/tsconfig.json ./tsconfig.json
ln -s config/vite.config.ts ./vite.config.ts
ln -s config/vitest.config.ts ./vitest.config.ts

echo "✅ Folder structure organized successfully!"
echo "📁 New structure: organized_testcase_tracker/"