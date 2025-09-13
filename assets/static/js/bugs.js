document.addEventListener('DOMContentLoaded', function() {
    // Load bugs on page load
    loadBugs();
    
    // Load projects for the dropdown
    loadProjects();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the status dropdown with background colors
    initializeStatusDropdowns();
});

/**
 * Sets up all event listeners for the bugs page
 */
function setupEventListeners() {
    // Add bug button
    const addBugBtn = document.getElementById('add-bug-btn');
    if (addBugBtn) {
        addBugBtn.addEventListener('click', function() {
            openAddBugModal();
        });
    }
    
    // Filter buttons
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadBugs();
        });
    }
    
    const projectFilter = document.getElementById('project-filter');
    if (projectFilter) {
        projectFilter.addEventListener('change', function() {
            loadBugs();
        });
    }
    
    // Bug form submission
    const bugForm = document.getElementById('bug-form');
    if (bugForm) {
        bugForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitBugForm();
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
    dropdown.classList.remove('status-open', 'status-in-progress', 'status-resolved', 'status-closed');
    
    // Add appropriate class based on selected value
    switch (selectedValue) {
        case 'Open':
            dropdown.classList.add('status-open');
            dropdown.style.backgroundColor = '#f39c12';
            break;
        case 'In Progress':
            dropdown.classList.add('status-in-progress');
            dropdown.style.backgroundColor = '#3498db';
            break;
        case 'Resolved':
            dropdown.classList.add('status-resolved');
            dropdown.style.backgroundColor = '#2ecc71';
            break;
        case 'Closed':
            dropdown.classList.add('status-closed');
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
 * Loads bug data from the server with optional filters
 */
function loadBugs() {
    const statusFilter = document.getElementById('status-filter').value;
    const projectFilter = document.getElementById('project-filter').value;
    
    // Build query string with filters
    const queryParams = new URLSearchParams({
        status: statusFilter,
        project: projectFilter
    });
    
    fetch(`/bugs/list?${queryParams.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderBugsTable(data);
        })
        .catch(error => {
            console.error('Error fetching bugs:', error);
            showAlert('Error loading bugs. Please try again later.', 'error');
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
    const projectSelect = document.getElementById('bug-project');
    if (projectSelect) {
        projectSelect.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }
}

/**
 * Renders the bugs table with the provided bug data
 * @param {Array} bugs - Array of bug objects
 */
function renderBugsTable(bugs) {
    const tableBody = document.getElementById('bugs-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (bugs.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" class="text-center">No bugs found</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    bugs.forEach(bug => {
        const row = document.createElement('tr');
        
        // Create status badge with appropriate color
        const statusClass = `status-${bug.status.toLowerCase().replace(' ', '-')}`;
        const statusBadge = `<span class="badge ${statusClass}">${bug.status}</span>`;
        
        // Create severity badge with appropriate color
        const severityClass = `severity-${bug.severity.toLowerCase()}`;
        const severityBadge = `<span class="badge ${severityClass}">${bug.severity}</span>`;
        
        row.innerHTML = `
            <td>${bug.id}</td>
            <td>${bug.title}</td>
            <td>${statusBadge}</td>
            <td>${severityBadge}</td>
            <td>${bug.project}</td>
            <td>
                <button class="btn btn-primary btn-sm edit-bug" data-id="${bug.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-bug" data-id="${bug.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-bug').forEach(button => {
        button.addEventListener('click', function() {
            const bugId = this.getAttribute('data-id');
            openEditBugModal(bugId);
        });
    });
    
    document.querySelectorAll('.delete-bug').forEach(button => {
        button.addEventListener('click', function() {
            const bugId = this.getAttribute('data-id');
            confirmDeleteBug(bugId);
        });
    });
}

/**
 * Opens the add bug modal
 */
function openAddBugModal() {
    // Reset form
    document.getElementById('bug-form').reset();
    document.getElementById('bug-id').value = '';
    document.getElementById('bug-modal-title').textContent = 'Add New Bug';
    
    // Update dropdown style
    const statusDropdown = document.getElementById('bug-status');
    updateDropdownStyle(statusDropdown);
    
    // Show modal
    document.getElementById('bug-modal').style.display = 'block';
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
 * Submits the bug form to create or update a bug
 */
function submitBugForm() {
    const bugId = document.getElementById('bug-id').value;
    const title = document.getElementById('bug-title').value;
    const description = document.getElementById('bug-description').value;
    const status = document.getElementById('bug-status').value;
    const severity = document.getElementById('bug-severity').value;
    const projectId = document.getElementById('bug-project').value;
    
    // Validate form
    if (!title || !description || !projectId) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    const bugData = {
        title,
        description,
        status,
        severity,
        project_id: projectId
    };
    
    let url = '/bugs/add';
    let method = 'POST';
    
    // If bug ID exists, update instead of add
    if (bugId) {
        url = `/bugs/update/${bugId}`;
        method = 'PUT';
    }
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bugData)
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
            loadBugs();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting bug:', error);
        showAlert('Error submitting bug. Please try again.', 'error');
    });
}

/**
 * Opens the edit bug modal for the specified bug
 * @param {string} bugId - The ID of the bug to edit
 */
function openEditBugModal(bugId) {
    // Fetch bug details
    fetch(`/bugs/get/${bugId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(bug => {
            // Populate form
            document.getElementById('bug-id').value = bug.id;
            document.getElementById('bug-title').value = bug.title;
            document.getElementById('bug-description').value = bug.description;
            document.getElementById('bug-status').value = bug.status;
            document.getElementById('bug-severity').value = bug.severity;
            document.getElementById('bug-project').value = bug.project_id;
            
            // Update dropdown style
            const statusDropdown = document.getElementById('bug-status');
            updateDropdownStyle(statusDropdown);
            
            // Update modal title
            document.getElementById('bug-modal-title').textContent = 'Edit Bug';
            
            // Show modal
            document.getElementById('bug-modal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching bug details:', error);
            showAlert('Error loading bug details. Please try again.', 'error');
        });
}

/**
 * Confirms and handles bug deletion
 * @param {string} bugId - The ID of the bug to delete
 */
function confirmDeleteBug(bugId) {
    if (confirm('Are you sure you want to delete this bug?')) {
        fetch(`/bugs/delete/${bugId}`, {
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
                loadBugs();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting bug:', error);
            showAlert('Error deleting bug. Please try again.', 'error');
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
