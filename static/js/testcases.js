document.addEventListener('DOMContentLoaded', function() {
    // Load test cases on page load
    loadTestCases();
    
    // Load projects for the dropdown
    loadProjects();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the status dropdown with background colors
    initializeStatusDropdowns();
});

/**
 * Sets up all event listeners for the test cases page
 */
function setupEventListeners() {
    // Add test case button
    const addTestCaseBtn = document.getElementById('add-testcase-btn');
    if (addTestCaseBtn) {
        addTestCaseBtn.addEventListener('click', function() {
            openAddTestCaseModal();
        });
    }
    
    // Import test cases button
    const importTestCasesBtn = document.getElementById('import-testcases-btn');
    if (importTestCasesBtn) {
        importTestCasesBtn.addEventListener('click', function() {
            openImportTestCasesModal();
        });
    }
    
    // Filter buttons
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadTestCases();
        });
    }
    
    const projectFilter = document.getElementById('project-filter');
    if (projectFilter) {
        projectFilter.addEventListener('change', function() {
            loadTestCases();
        });
    }
    
    // Test case form submission
    const testCaseForm = document.getElementById('testcase-form');
    if (testCaseForm) {
        testCaseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitTestCaseForm();
        });
    }
    
    // Import form submission
    const importForm = document.getElementById('import-form');
    if (importForm) {
        importForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitImportForm();
        });
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModals();
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModals();
            }
        });
    });
}

/**
 * Initializes status dropdowns with appropriate background colors
 */
function initializeStatusDropdowns() {
    const statusDropdowns = document.querySelectorAll('.status-select');
    
    statusDropdowns.forEach(dropdown => {
        // Set initial background color based on selected value
        updateDropdownStyle(dropdown);
        
        // Update background when selection changes
        dropdown.addEventListener('change', function() {
            updateDropdownStyle(this);
        });
    });
}

/**
 * Updates the background color of a status dropdown based on its selected value
 * @param {HTMLElement} dropdown - The dropdown element to style
 */
function updateDropdownStyle(dropdown) {
    const selectedValue = dropdown.value;
    
    // Remove all existing status classes
    dropdown.classList.remove('status-passed', 'status-failed', 'status-blocked', 'status-not-run');
    
    // Add appropriate class based on selected value
    switch (selectedValue) {
        case 'Passed':
            dropdown.classList.add('status-passed');
            dropdown.style.backgroundColor = '#2ecc71';
            break;
        case 'Failed':
            dropdown.classList.add('status-failed');
            dropdown.style.backgroundColor = '#e74c3c';
            break;
        case 'Blocked':
            dropdown.classList.add('status-blocked');
            dropdown.style.backgroundColor = '#f39c12';
            break;
        case 'Not Run':
            dropdown.classList.add('status-not-run');
            dropdown.style.backgroundColor = '#95a5a6';
            break;
        case 'All':
            dropdown.style.backgroundColor = '#3498db';
            break;
        default:
            dropdown.style.backgroundColor = '#3498db';
    }
    
    // Ensure text is readable
    dropdown.style.color = 'white';
}

/**
 * Loads test case data from the server with optional filters
 */
function loadTestCases() {
    const statusFilter = document.getElementById('status-filter').value;
    const projectFilter = document.getElementById('project-filter').value;
    
    // Build query string with filters
    const queryParams = new URLSearchParams({
        status: statusFilter,
        project: projectFilter
    });
    
    fetch(`/testcases/list?${queryParams.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderTestCasesTable(data);
        })
        .catch(error => {
            console.error('Error fetching test cases:', error);
            showAlert('Error loading test cases. Please try again later.', 'error');
        });
}

/**
 * Loads project data for dropdown selectors
 */
function loadProjects() {
    fetch('/projects')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            populateProjectDropdowns(data);
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            showAlert('Error loading projects. Please try again later.', 'error');
        });
}

/**
 * Populates project dropdown selectors with project data
 * @param {Array} projects - Array of project objects
 */
function populateProjectDropdowns(projects) {
    // Populate filter dropdown
    const projectFilter = document.getElementById('project-filter');
    if (projectFilter) {
        projectFilter.innerHTML = '<option value="All">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }
    
    // Populate form dropdown
    const projectSelect = document.getElementById('testcase-project');
    if (projectSelect) {
        projectSelect.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }
    
    // Populate import form dropdown
    const importProjectSelect = document.getElementById('import-project');
    if (importProjectSelect) {
        importProjectSelect.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            importProjectSelect.appendChild(option);
        });
    }
}

/**
 * Renders the test cases table with the provided test case data
 * @param {Array} testCases - Array of test case objects
 */
function renderTestCasesTable(testCases) {
    const tableBody = document.getElementById('testcases-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (testCases.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center">No test cases found</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    testCases.forEach(testCase => {
        const row = document.createElement('tr');
        
        // Create status badge with appropriate color
        const statusClass = `status-${testCase.status.toLowerCase().replace(' ', '-')}`;
        const statusBadge = `<span class="badge ${statusClass}">${testCase.status}</span>`;
        
        row.innerHTML = `
            <td>${testCase.id}</td>
            <td>${testCase.title}</td>
            <td>${statusBadge}</td>
            <td>${testCase.project}</td>
            <td>
                <button class="btn btn-primary btn-sm edit-testcase" data-id="${testCase.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-testcase" data-id="${testCase.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-testcase').forEach(button => {
        button.addEventListener('click', function() {
            const testCaseId = this.getAttribute('data-id');
            openEditTestCaseModal(testCaseId);
        });
    });
    
    document.querySelectorAll('.delete-testcase').forEach(button => {
        button.addEventListener('click', function() {
            const testCaseId = this.getAttribute('data-id');
            confirmDeleteTestCase(testCaseId);
        });
    });
}

/**
 * Opens the add test case modal
 */
function openAddTestCaseModal() {
    // Reset form
    document.getElementById('testcase-form').reset();
    document.getElementById('testcase-id').value = '';
    document.getElementById('testcase-modal-title').textContent = 'Add New Test Case';
    
    // Update dropdown style
    const statusDropdown = document.getElementById('testcase-status');
    updateDropdownStyle(statusDropdown);
    
    // Show modal
    document.getElementById('testcase-modal').style.display = 'block';
}

/**
 * Opens the import test cases modal
 */
function openImportTestCasesModal() {
    // Reset form
    document.getElementById('import-form').reset();
    
    // Show modal
    document.getElementById('import-modal').style.display = 'block';
}

/**
 * Closes all open modals
 */
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

/**
 * Submits the test case form to create or update a test case
 */
function submitTestCaseForm() {
    const testCaseId = document.getElementById('testcase-id').value;
    const title = document.getElementById('testcase-title').value;
    const description = document.getElementById('testcase-description').value;
    const steps = document.getElementById('testcase-steps').value;
    const expectedResult = document.getElementById('testcase-expected-result').value;
    const status = document.getElementById('testcase-status').value;
    const projectId = document.getElementById('testcase-project').value;
    
    // Validate form
    if (!title || !projectId) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    const testCaseData = {
        title,
        description,
        steps,
        expected_result: expectedResult,
        status,
        project_id: projectId
    };
    
    let url = '/testcases/add';
    let method = 'POST';
    
    // If test case ID exists, update instead of add
    if (testCaseId) {
        url = `/testcases/update/${testCaseId}`;
        method = 'PUT';
    }
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCaseData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            closeModals();
            loadTestCases();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting test case:', error);
        showAlert('Error submitting test case. Please try again.', 'error');
    });
}

/**
 * Submits the import form to import test cases from a CSV file
 */
function submitImportForm() {
    const fileInput = document.getElementById('import-file');
    const projectId = document.getElementById('import-project').value;
    
    // Validate form
    if (!fileInput.files.length || !projectId) {
        showAlert('Please select a file and project', 'error');
        return;
    }
    
    // Validate file type (only CSV allowed)
    const file = fileInput.files[0];
    if (!file.name.endsWith('.csv')) {
        showAlert('Please select a CSV file', 'error');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    
    // Submit form
    fetch('/testcases/import', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            closeModals();
            loadTestCases();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error importing test cases:', error);
        showAlert('Error importing test cases. Please try again.', 'error');
    });
}

/**
 * Opens the edit test case modal for the specified test case
 * @param {string} testCaseId - The ID of the test case to edit
 */
function openEditTestCaseModal(testCaseId) {
    // Fetch test case details
    fetch(`/testcases/get/${testCaseId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(testCase => {
            // Populate form
            document.getElementById('testcase-id').value = testCase.id;
            document.getElementById('testcase-title').value = testCase.title;
            document.getElementById('testcase-description').value = testCase.description;
            document.getElementById('testcase-steps').value = testCase.steps;
            document.getElementById('testcase-expected-result').value = testCase.expected_result;
            document.getElementById('testcase-status').value = testCase.status;
            document.getElementById('testcase-project').value = testCase.project_id;
            
            // Update dropdown style
            const statusDropdown = document.getElementById('testcase-status');
            updateDropdownStyle(statusDropdown);
            
            // Update modal title
            document.getElementById('testcase-modal-title').textContent = 'Edit Test Case';
            
            // Show modal
            document.getElementById('testcase-modal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching test case details:', error);
            showAlert('Error loading test case details. Please try again.', 'error');
        });
}

/**
 * Confirms and handles test case deletion
 * @param {string} testCaseId - The ID of the test case to delete
 */
function confirmDeleteTestCase(testCaseId) {
    if (confirm('Are you sure you want to delete this test case?')) {
        fetch(`/testcases/delete/${testCaseId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showAlert(data.message, 'success');
                loadTestCases();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting test case:', error);
            showAlert('Error deleting test case. Please try again.', 'error');
        });
    }
}

/**
 * Displays an alert message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of alert (success, error, warning)
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    alertDiv.textContent = message;
    
    alertContainer.appendChild(alertDiv);
    
    // Remove the alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
