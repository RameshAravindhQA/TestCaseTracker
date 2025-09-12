# How to Run the TestCaseTracker Application

## Option 1: Using the Run Button

1. Click on the "Run" button at the top of your Replit interface
2. In the command input, enter: `cd "TestCaseTracker (1)" && npm run dev`
3. Click "Run"

## Option 2: Creating a Workflow

1. Click on the "Tools" in the left sidebar
2. Select "Workflows"
3. Click "Create workflow" button
4. Fill in the following details:
   - Name: `Start TestCaseTracker` 
   - Add a task: `shell.exec`
   - Set the command to: `cd "TestCaseTracker (1)" && npm run dev`
   - Save the workflow
5. Run the workflow by selecting it from the Run dropdown

## Important Notes

- The application serves on port 5005
- There might be a warning about Playwright dependencies, but it doesn't affect the core application functionality
- The application provides both a backend API server and serves the frontend
