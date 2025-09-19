document.addEventListener('DOMContentLoaded', function() {
    // Fetch real-time dashboard data
    fetchDashboardStats();

    // Set up refresh interval (every 30 seconds)
    setInterval(fetchDashboardStats, 30000);
});

/**
 * Fetches real-time dashboard statistics data from the server
 */
function fetchDashboardStats() {
    fetch('/dashboard/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update dashboard counters with real data
            updateDashboardCounters(data);
            
            // Create or update charts if they exist
            if (typeof updateBugChart === 'function') {
                updateBugChart(data.bug_stats);
            }
            
            if (typeof updateTestCaseChart === 'function') {
                updateTestCaseChart(data.test_case_stats);
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard stats:', error);
            showAlert('Error loading dashboard data. Please try again later.', 'error');
        });
}

/**
 * Updates all dashboard counter elements with the provided data
 * @param {Object} data - The dashboard statistics data
 */
function updateDashboardCounters(data) {
    // Update total counters
    document.getElementById('total-test-cases').textContent = data.total_test_cases;
    document.getElementById('total-bugs').textContent = data.total_bugs;
    
    // Update bug stats
    document.getElementById('open-bugs').textContent = data.bug_stats.open;
    document.getElementById('in-progress-bugs').textContent = data.bug_stats.in_progress;
    document.getElementById('resolved-bugs').textContent = data.bug_stats.resolved;
    document.getElementById('closed-bugs').textContent = data.bug_stats.closed;
    
    // Update test case stats
    document.getElementById('passed-tests').textContent = data.test_case_stats.passed;
    document.getElementById('failed-tests').textContent = data.test_case_stats.failed;
    document.getElementById('blocked-tests').textContent = data.test_case_stats.blocked;
    document.getElementById('not-run-tests').textContent = data.test_case_stats.not_run;
    
    // Calculate and update percentages
    if (data.total_bugs > 0) {
        const resolvedPercentage = Math.round((data.bug_stats.resolved + data.bug_stats.closed) / data.total_bugs * 100);
        document.getElementById('resolved-percentage').textContent = resolvedPercentage + '%';
    }
    
    if (data.total_test_cases > 0) {
        const executedPercentage = Math.round((data.test_case_stats.passed + data.test_case_stats.failed) / data.total_test_cases * 100);
        document.getElementById('executed-percentage').textContent = executedPercentage + '%';
    }
}

/**
 * Creates and updates the bug status distribution chart
 * @param {Object} bugStats - Bug statistics data
 */
function updateBugChart(bugStats) {
    const ctx = document.getElementById('bug-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.bugChart) {
        window.bugChart.destroy();
    }
    
    // Create new chart
    window.bugChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
            datasets: [{
                data: [
                    bugStats.open,
                    bugStats.in_progress,
                    bugStats.resolved,
                    bugStats.closed
                ],
                backgroundColor: [
                    '#f39c12', // Open - Orange
                    '#3498db', // In Progress - Blue
                    '#2ecc71', // Resolved - Green
                    '#95a5a6'  // Closed - Gray
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'bottom'
            }
        }
    });
}

/**
 * Creates and updates the test case status distribution chart
 * @param {Object} testCaseStats - Test case statistics data
 */
function updateTestCaseChart(testCaseStats) {
    const ctx = document.getElementById('test-case-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.testCaseChart) {
        window.testCaseChart.destroy();
    }
    
    // Create new chart
    window.testCaseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Blocked', 'Not Run'],
            datasets: [{
                data: [
                    testCaseStats.passed,
                    testCaseStats.failed,
                    testCaseStats.blocked,
                    testCaseStats.not_run
                ],
                backgroundColor: [
                    '#2ecc71', // Passed - Green
                    '#e74c3c', // Failed - Red
                    '#f39c12', // Blocked - Orange
                    '#95a5a6'  // Not Run - Gray
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'bottom'
            }
        }
    });
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
