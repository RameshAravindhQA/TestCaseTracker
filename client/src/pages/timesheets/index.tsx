I will replace the template literals with string concatenation in the specified lines within the TimeSheetsPage component.
```
// If month is the only active filter, reset to current month
              if (!currentProject && !currentCustomer && !selectedFolderId) {
                const now = new Date();
                setCurrentMonth(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));
              } else {
                // Otherwise clear all filters
                setCurrentProject(null);
                setCurrentCustomer(null);
                setSelectedFolderId(null);
                const now = new Date();
                setCurrentMonth(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));
              }