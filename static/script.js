// Test if libraries are loaded
console.log('=== CHECKING LIBRARIES ===');
console.log('PapaParse loaded:', typeof Papa !== 'undefined');
console.log('Plotly loaded:', typeof Plotly !== 'undefined');

// Global App State
let rawData = [];
let filteredData = [];
let currentChart = 'time_series';
let currentMetric = 'Cases';
let currentPage = 'statistics'; // 'statistics' or 'ml'

// DOM Element Refs
const fileInput = document.getElementById('csvFile');
const fileStatus = document.getElementById('fileStatus');
const dataInfo = document.getElementById('dataInfo');
const mainNav = document.getElementById('mainNav');
const welcomeMessage = document.getElementById('welcomeMessage');

// Page Containers
const statsPage = document.getElementById('statistics-page');
const mlPage = document.getElementById('ml-page');
const resourcePage = document.getElementById('resource-page');
const timelinePage = document.getElementById('timeline-page');

// Main Nav Buttons
const navBtnStats = document.getElementById('main-nav-btn-stats');
const navBtnMl = document.getElementById('main-nav-btn-ml');
const navBtnResource = document.getElementById('main-nav-btn-resource');
const navBtnTimeline = document.getElementById('main-nav-btn-timeline');

// Statistics Page Elements
const statsControls = document.getElementById('statistics-controls');
const statsGrid = document.getElementById('statsGrid');
const chartContainer = document.getElementById('chartContainer');
const chartTitle = document.getElementById('chartTitle');
const chartDiv = document.getElementById('chart');

// ML Page Elements
const mlControls = document.getElementById('ml-controls');
const mlChartContainer = document.getElementById('mlChartContainer');
const mlChartTitle = document.getElementById('mlChartTitle');
const mlChartContent = document.getElementById('mlChartContent');
const btnRunForecast = document.getElementById('run-forecast-btn');
const btnRunComparison = document.getElementById('run-comparison-btn');



// Resource Simulator Elements
const resourceControls = document.getElementById('resource-controls');
const resourceChartContainer = document.getElementById('resourceChartContainer');
const resourceChartTitle = document.getElementById('resourceChartTitle');
const resourceChartContent = document.getElementById('resourceChartContent');
const btnRunSimulation = document.getElementById('run-simulation-btn');
const btnExportReport = document.getElementById('export-report-btn');

// Timeline Animation Elements
const timelineControls = document.getElementById('timeline-controls');
const timelineChartContainer = document.getElementById('timelineChartContainer');
const timelineChartTitle = document.getElementById('timelineChartTitle');
const timelineChartContent = document.getElementById('timelineChartContent');
const btnTimelinePlay = document.getElementById('timeline-play-btn');
const btnTimelinePause = document.getElementById('timeline-pause-btn');
const btnTimelineReset = document.getElementById('timeline-reset-btn');
const timelineProgress = document.getElementById('timelineProgress');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');

// Animation state
let animationInterval = null;
let animationData = null;
let currentAnimationFrame = 0;
let simulationResults = null;

// --- 1. FILE LOADING & INITIALIZATION ---

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    console.log('=== FILE UPLOAD STARTED ===');
    fileStatus.innerHTML = '⏳ Loading file... <div class="loading-spinner"></div>';
    fileStatus.className = 'file-status loading';
    
    const fileName = file.name.toLowerCase();
    const isSupported = fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.tsv');
    
    if (!isSupported) {
        fileStatus.innerHTML = '❌ Please upload a supported file (.csv, .txt, or .tsv)';
        fileStatus.className = 'file-status error';
        return;
    }
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('=== PARSE COMPLETE ===');
            if (results.errors && results.errors.length > 0) {
                console.warn('Parsing errors found:', results.errors);
            }
            
            rawData = results.data.filter(row => 
                row && typeof row === 'object' && 'Cases' in row
            );
            
            console.log('Filtered data rows:', rawData.length);
            
            if (rawData.length > 0) {
                fileStatus.innerHTML = `✅ Successfully loaded ${rawData.length} records!`;
                fileStatus.className = 'file-status success';
                
                const columns = Object.keys(rawData[0]);
                const years = rawData.map(d => d.year).filter(y => y);
                const minYear = years.length > 0 ? Math.min(...years) : 'N/A';
                const maxYear = years.length > 0 ? Math.max(...years) : 'N/A';
                
                dataInfo.innerHTML = `
                    <strong>📊 Data Summary:</strong><br>
                    • Records: ${rawData.length.toLocaleString()}<br>
                    • Columns: ${columns.length}<br>
                    • Date Range: ${minYear} - ${maxYear}<br>
                    • Key Columns: ${columns.slice(0, 5).join(', ')}...
                `;
                dataInfo.style.display = 'block';
                
                console.log('Initializing dashboard...');
                initializeDashboard();
            } else {
                console.error('No valid data after filtering');
                fileStatus.innerHTML = '❌ No valid data found in file. Please check your file format.';
                fileStatus.className = 'file-status error';
            }
        },
        error: function(error) {
            console.error('=== PARSE ERROR ===', error);
            fileStatus.innerHTML = `❌ Error loading file: ${error.message || 'Unknown error'}`;
            fileStatus.className = 'file-status error';
        }
    });
});

function initializeDashboard() {
    // Hide welcome message
    welcomeMessage.style.display = 'none';
    
    // Show main nav and default page
    mainNav.style.display = 'flex';
    statsPage.style.display = 'block';
    statsControls.style.display = 'block'; // Show stats controls
    
    // Populate BOTH sets of filters
    populateFilters('stats-');
    populateFilters('ml-');
    
    // Set up all event listeners
    setupEventListeners();

    // Load initial data for stats page
    updateData();
    
    console.log('Dashboard initialized successfully');
}

/**
 * Populates filter dropdowns.
 */
function populateFilters() {
    console.log('Populating all filters');
    
    // Get unique values
    const diseases = ['All', ...new Set(rawData.map(d => d.Disease_Clean).filter(Boolean))];
    const districts = ['All', ...new Set(rawData.map(d => d.district).filter(Boolean))].sort();
    const years = ['All', ...new Set(rawData.map(d => d.year).filter(Boolean))].sort();
    
    // Populate Statistics Page filters
    const diseaseSelect = document.getElementById('diseaseFilter');
    if (diseaseSelect) {
        diseaseSelect.innerHTML = diseases.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    const districtSelect = document.getElementById('districtFilter');
    if (districtSelect) {
        districtSelect.innerHTML = districts.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    const yearSelect = document.getElementById('yearFilter');
    if (yearSelect) {
        yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    }

    const monthNames = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthSelect = document.getElementById('monthFilter');
    if (monthSelect) {
        monthSelect.innerHTML = monthNames.map((m, i) => 
            `<option value="${i === 0 ? 'All' : i}">${m}</option>`
        ).join('');
    }

    // Populate ML Page filters
    const mlDiseaseSelect = document.getElementById('ml-diseaseFilter');
    if (mlDiseaseSelect) {
        mlDiseaseSelect.innerHTML = diseases.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    const mlDistrictSelect = document.getElementById('ml-districtFilter');
    if (mlDistrictSelect) {
        mlDistrictSelect.innerHTML = districts.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

function populateResourceFilters() {
    const diseases = [...new Set(rawData.map(d => d.Disease_Clean).filter(Boolean))].sort();
    const districts = [...new Set(rawData.map(d => d.district).filter(Boolean))].sort();
    
    const resourceDiseaseSelect = document.getElementById('resource-diseaseFilter');
    if (resourceDiseaseSelect) {
        resourceDiseaseSelect.innerHTML = '<option value="">Select a Disease</option>' + 
            diseases.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    const resourceDistrictSelect = document.getElementById('resource-districtFilter');
    if (resourceDistrictSelect) {
        resourceDistrictSelect.innerHTML = '<option value="">Select a District</option>' + 
            districts.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

function populateTimelineFilters() {
    const diseases = ['All', ...new Set(rawData.map(d => d.Disease_Clean).filter(Boolean))].sort();
    
    const timelineDiseaseSelect = document.getElementById('timeline-diseaseFilter');
    if (timelineDiseaseSelect) {
        timelineDiseaseSelect.innerHTML = diseases.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

// --- 2. EVENT LISTENERS ---

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // --- Main Tab Navigation ---
    navBtnStats.addEventListener('click', switchToStatsPage);
    navBtnMl.addEventListener('click', switchToMlPage);
    navBtnResource.addEventListener('click', switchToResourcePage);
    navBtnTimeline.addEventListener('click', switchToTimelinePage);

    // --- Statistics Page Listeners ---
    document.getElementById('diseaseFilter').addEventListener('change', updateData);
    document.getElementById('districtFilter').addEventListener('change', updateData);
    document.getElementById('yearFilter').addEventListener('change', updateData);
    document.getElementById('monthFilter').addEventListener('change', updateData);

    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Stats chart button clicked:', this.dataset.chart);
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentChart = this.dataset.chart;
            
            if (['district_bar', 'healthcare'].includes(currentChart)) {
                document.getElementById('metricSelector').style.display = 'flex';
            } else {
                document.getElementById('metricSelector').style.display = 'none';
            }
            updateChart();
        });
    });

    document.querySelectorAll('.metric-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Metric button clicked:', this.dataset.metric);
            document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMetric = this.dataset.metric;
            updateChart();
        });
    });
    
    // --- ML Page Listeners ---
    btnRunForecast.addEventListener('click', handleRunForecast);
    btnRunComparison.addEventListener('click', handleRunComparison);
    
    // --- Resource Simulator Listeners ---
    btnRunSimulation.addEventListener('click', handleRunSimulation);
    btnExportReport.addEventListener('click', handleExportReport);
    
    // --- Timeline Animation Listeners ---
    btnTimelinePlay.addEventListener('click', handleTimelinePlay);
    btnTimelinePause.addEventListener('click', handleTimelinePause);
    btnTimelineReset.addEventListener('click', handleTimelineReset);
    
    console.log('Event listeners set up');
}

// --- 3. PAGE SWITCHING LOGIC ---

function switchToStatsPage() {
    if (currentPage === 'statistics') return;
    console.log('Switching to Statistics page');
    currentPage = 'statistics';

    // Toggle pages
    mlPage.classList.remove('active');
    mlPage.style.display = 'none';
    statsPage.classList.add('active');
    statsPage.style.display = 'block';

    // Toggle nav buttons
    navBtnMl.classList.remove('active');
    navBtnStats.classList.add('active');

    // Refresh stats data
    updateData();
}

function switchToMlPage() {
    if (currentPage === 'ml') return;
    console.log('Switching to ML page');
    currentPage = 'ml';

    // Toggle pages
    statsPage.classList.remove('active');
    statsPage.style.display = 'none';
    mlPage.classList.add('active');
    mlPage.style.display = 'block';

    // Toggle nav buttons
    navBtnStats.classList.remove('active');
    navBtnMl.classList.add('active');
    
    // Reset ML chart container
    mlChartTitle.textContent = 'ML Model Predictions';
    mlChartContent.innerHTML = `
        <div class="ml-welcome">
            <h2>Welcome to the ML Prediction Hub</h2>
            <p>
                • <b>Run Single Forecast:</b> Select a specific disease and district to get a 4-week bed day forecast.
                <br>
                • <b>Run Model Comparison:</b> Run a full ML pipeline on the server to compare all models (this may take 30-60 seconds).
            </p>
        </div>
    `;
}

function switchToResourcePage() {
    if (currentPage === 'resource') return;
    console.log('Switching to Resource Simulator page');
    currentPage = 'resource';

    // Hide all pages
    statsPage.classList.remove('active');
    statsPage.style.display = 'none';
    mlPage.classList.remove('active');
    mlPage.style.display = 'none';
    timelinePage.classList.remove('active');
    timelinePage.style.display = 'none';
    
    // Show resource page
    resourcePage.classList.add('active');
    resourcePage.style.display = 'block';

    // Update nav buttons
    navBtnStats.classList.remove('active');
    navBtnMl.classList.remove('active');
    navBtnTimeline.classList.remove('active');
    navBtnResource.classList.add('active');

    populateResourceFilters();
}

function switchToTimelinePage() {
    if (currentPage === 'timeline') return;
    console.log('Switching to Timeline Animation page');
    currentPage = 'timeline';

    // Hide all pages
    statsPage.classList.remove('active');
    statsPage.style.display = 'none';
    mlPage.classList.remove('active');
    mlPage.style.display = 'none';
    resourcePage.classList.remove('active');
    resourcePage.style.display = 'none';
    
    // Show timeline page
    timelinePage.classList.add('active');
    timelinePage.style.display = 'block';

    // Update nav buttons
    navBtnStats.classList.remove('active');
    navBtnMl.classList.remove('active');
    navBtnResource.classList.remove('active');
    navBtnTimeline.classList.add('active');
    

     populateTimelineFilters();


    // Stop any running animation
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

// --- 4. STATISTICS PAGE LOGIC ---

function updateData() {
    const disease = document.getElementById('diseaseFilter').value;
    const district = document.getElementById('districtFilter').value;
    const year = document.getElementById('yearFilter').value;
    const month = document.getElementById('monthFilter').value;

    console.log('Updating stats data with filters:', { disease, district, year, month });

    filteredData = rawData.filter(d => 
        (disease === 'All' || d.Disease_Clean === disease) &&
        (district === 'All' || d.district === district) &&
        (year === 'All' || d.year === parseInt(year)) &&
        (month === 'All' || d.mon === parseInt(month))
    );

    console.log('Filtered data count:', filteredData.length);
    updateStats();
    updateChart();
}

function updateStats() {
    const totalCases = filteredData.reduce((sum, d) => sum + (d.Cases || 0), 0);
    const totalBedDays = filteredData.reduce((sum, d) => sum + (d.Bed_Days || 0), 0);
    const totalICU = filteredData.reduce((sum, d) => sum + (d.ICU_Required || 0), 0);
    const avgTrend = filteredData.length > 0 
        ? (filteredData.reduce((sum, d) => sum + (d.Cases_trend_4w || 0), 0) / filteredData.length).toFixed(2)
        : 0;
    
    const uniqueDistricts = new Set(filteredData.map(d => d.district)).size;
    const uniqueDiseases = new Set(filteredData.map(d => d.Disease_Clean)).size;

    document.getElementById('totalCases').textContent = totalCases.toLocaleString();
    document.getElementById('totalDistricts').textContent = uniqueDistricts;
    document.getElementById('totalDiseases').textContent = uniqueDiseases;
    document.getElementById('avgTrend').textContent = avgTrend;
    document.getElementById('totalBedDays').textContent = Math.round(totalBedDays).toLocaleString();
    document.getElementById('totalICU').textContent = Math.round(totalICU).toLocaleString();
}

function updateChart() {
    if (filteredData.length === 0) {
        chartTitle.textContent = '⚠️ No data available for selected filters';
        Plotly.purge('chart');
        return;
    }

    console.log('Updating stats chart:', currentChart);

    switch(currentChart) {
        case 'time_series': renderTimeSeries(); break;
        case 'seasonal': renderSeasonalPattern(); break;
        case 'district_bar': renderDistrictComparison(); break;
        case 'disease_pie': renderDiseasePie(); break;
        case 'correlation': renderCorrelation(); break;
        case 'lag_scatter': renderLagScatter(); break;
        case 'trend_box': renderTrendBox(); break;
        case 'healthcare': renderHealthcare(); break;
        // The ML charts are no longer in this switch
    }
}

// All stats render functions (renderTimeSeries, renderSeasonalPattern, etc.)
// go here. They are UNCHANGED from the previous version.
// ... (omitted for brevity, they are the same as before) ...


// --- 5. ML PAGE LOGIC ---

// Helper function to show loading state on ML buttons
function setButtonLoading(button, isLoading) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.btn-spinner');
    if (isLoading) {
        text.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;
    } else {
        text.style.display = 'inline-block';
        spinner.style.display = 'none';
        button.disabled = false;
    }
}

async function handleRunForecast() {
    setButtonLoading(btnRunForecast, true);
    
    // 1. Show a loading state in the ML chart container
    mlChartTitle.textContent = '🔮 Generating Bed Day Forecast...';
    mlChartContent.innerHTML = '<div class="loading-spinner"></div>';

    // 2. Get current filters *from the ML tab*
    const disease = document.getElementById('ml-diseaseFilter').value;
    const district = document.getElementById('ml-districtFilter').value;

    // 3. Check for valid inputs
    if (disease === 'All' || district === 'All') {
        mlChartTitle.textContent = '🔮 Forecast Requires a Specific Disease and District';
        mlChartContent.innerHTML = '<p style="text-align: center; color: var(--text-light);">Please select one disease and one district from the filters above to generate a forecast.</p>';
        setButtonLoading(btnRunForecast, false);
        return;
    }

    console.log(`Sending forecast request: Disease=${disease}, District=${district}`);

    try {
        // 4. Call the Python API
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disease: disease, district: district }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // 6. Plot the data using Plotly
            mlChartTitle.textContent = `🔮 Bed Day Forecast: ${district} - ${disease}`;
            mlChartContent.innerHTML = ''; // Clear spinner

            const chartDiv = document.getElementById("mlChartContent");

            // 1️⃣ Clear previous content
            chartDiv.innerHTML = "";
            chartDiv.classList.remove("ml-welcome");
            
            const trace = {
                x: data.labels,
                y: data.forecast,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Forecasted Bed Days',
                line: { color: 'var(--primary)', width: 3 },
                marker: { size: 8 }
            };
            const layout = {
                xaxis: { title: 'Forecast Period' },
                yaxis: { title: 'Predicted Bed Days' },
                hovermode: 'closest',
                plot_bgcolor: 'var(--bg-light)',
            };

           Plotly.newPlot(chartDiv, [trace], layout, { responsive: true })
  .then(() => Plotly.Plots.resize(chartDiv));
  /*.then(() => {
      Plotly.Plots.resize('mlChartContent');
      document.getElementById('mlChartContent').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });*/
        } else {
            throw new Error(data.error || 'Prediction failed');
        }

    } catch (error) {
        // 7. Handle errors
        console.error('Error fetching forecast:', error);
        mlChartTitle.textContent = '❌ Forecast Failed';
        mlChartContent.innerHTML = `
            <p style="text-align: center; color: var(--text-light);">
                Could not generate forecast. <br>
                <strong>Error:</strong> ${error.message} <br><br>
                Is the Python server (<code>app.py</code>) running?
            </p>
        `;
    }
    
    setButtonLoading(btnRunForecast, false);
}

async function handleRunComparison() {
    setButtonLoading(btnRunComparison, true);

    // 1. Show a strong loading state
    mlChartTitle.textContent = '📊 Running Full ML Model Comparison...';
    mlChartContent.innerHTML = `
        <p style="text-align: center; color: var(--text-light); margin-bottom: 20px;">
            This may take 30-60 seconds as the server is training 
            multiple machine learning models on the entire dataset.
        </p>
        <div class="loading-spinner"></div>
    `;

    console.log("Sending request for /run_comparison");

    try {
        // 2. Call the new Python API endpoint
        const response = await fetch('http://localhost:5000/run_comparison', {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log("Comparison data received:", data);
            
            // 4. Clear the chart div and set title
            mlChartContent.innerHTML = '';
            mlChartTitle.textContent = '📊 ML Model Comparison Report';

            // 5. Build and insert the results table
            mlChartContent.innerHTML += '<h3>Model Performance Metrics</h3>';
            mlChartContent.innerHTML += createHtmlTable(data.comparison_table);

            // 6. Create divs for our new charts
            mlChartContent.innerHTML += '<div id="comparisonBarChart" style="width:100%; height:500px; margin-top: 20px;"></div>';
            mlChartContent.innerHTML += '<h3 style="margin-top: 40px;">Forecast vs. Actuals (Test Set)</h3>';
            mlChartContent.innerHTML += '<div id="comparisonLineChart" style="width:100%; height:600px; margin-top: 20px;"></div>';

            // 7. Render RMSE Bar Chart
            renderComparisonBarChart(data.comparison_table);

            // 8. Render "Actual vs. All" Line Chart
            renderComparisonLineChart(data.plot_data);

        } else {
            throw new Error(data.error || 'Comparison run failed');
        }

    } catch (error) {
        // 9. Handle errors
        console.error('Error fetching comparison report:', error);
        mlChartTitle.textContent = '❌ Comparison Failed';
        mlChartContent.innerHTML = `
            <p style="text-align: center; color: var(--text-light);">
                Could not generate the comparison report. <br>
                <strong>Error:</strong> ${error.message} <br><br>
                Make sure the server is running and the data file
                (<code>tamilnadu_data_enhanced_combined_strategy2_3.csv</code>) 
                is in the same directory as <code>app.py</code>.
            </p>
        `;
    }
    
    setButtonLoading(btnRunComparison, false);
}

// --- 6. ML HELPER & PLOTTING FUNCTIONS ---

function createHtmlTable(data) {
    if (!data || data.length === 0) return '<p>No comparison data found.</p>';
    const headers = Object.keys(data[0]);
    let table = '<table class="comparison-table">';
    table += '<thead><tr>';
    headers.forEach(h => table += `<th>${h}</th>`);
    table += '</tr></thead>';
    table += '<tbody>';
    data.forEach(row => {
        table += '<tr>';
        headers.forEach(header => {
            let value = row[header];
            if (typeof value === 'number') {
                value = value.toFixed(4);
            }
            table += `<td>${value}</td>`;
        });
        table += '</tr>';
    });
    table += '</tbody></table>';
    return table; // Style is in CSS file
}

function renderComparisonBarChart(tableData) {
    const sortedData = [...tableData].sort((a, b) => a.RMSE - b.RMSE);
    const trace = {
        x: sortedData.map(d => d.Model),
        y: sortedData.map(d => d.RMSE),
        type: 'bar',
        name: 'RMSE',
        marker: { color: 'var(--primary)', opacity: 0.8 }
    };
    const layout = {
        title: 'Model Comparison by RMSE (Lower is Better)',
        xaxis: { title: 'Model' },
        yaxis: { title: 'Root Mean Squared Error (RMSE)' },
        plot_bgcolor: 'var(--bg-light)',
    };
    Plotly.newPlot('comparisonBarChart', [trace], layout, {responsive: true});
}

function renderComparisonLineChart(plotData) {
    const traces = [];
    traces.push({
        y: plotData['Actual'],
        mode: 'lines',
        name: 'Actual (Test Set)',
        line: { color: '#000000', width: 4 }
    });
    Object.keys(plotData).forEach(modelName => {
        if (modelName === 'Actual') return;
        traces.push({
            y: plotData[modelName],
            mode: 'lines',
            name: `${modelName} (Pred)`,
            line: { dash: 'dot', width: 2 },
            opacity: 0.8
        });
    });
    const layout = {
        title: 'Model Forecasts vs. Actual Values (on Test Set)',
        xaxis: { title: 'Time (Weeks in Test Set)' },
        yaxis: { title: 'Bed Days' },
        hovermode: 'x unified',
        plot_bgcolor: 'var(--bg-light)',
        legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' }
    };
    Plotly.newPlot('comparisonLineChart', traces, layout, {responsive: true});
}


// --- 7. STATISTICS PLOTTING FUNCTIONS (UNCHANGED) ---
// (Paste all your original render... functions here)

function renderTimeSeries() {
    document.getElementById('chartTitle').textContent = '📈 Time Series Analysis - Cases Over Time';
    const sortedData = [...filteredData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (a.week_of_outbreak || 0) - (b.week_of_outbreak || 0);
    });
    const aggregatedData = {};
    sortedData.forEach(d => {
        const key = `${d.year}-W${d.week_of_outbreak}`;
        if (!aggregatedData[key]) {
            aggregatedData[key] = { Cases: 0, Cases_MA_3w: 0, count: 0, year: d.year, week: d.week_of_outbreak };
        }
        aggregatedData[key].Cases += d.Cases || 0;
        aggregatedData[key].Cases_MA_3w += d.Cases_MA_3w || 0;
        aggregatedData[key].count++;
    });
    const plotData = Object.values(aggregatedData).sort((a, b) => {
         if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
    });
    const step = Math.max(1, Math.floor(plotData.length / 500));
    const displayData = plotData.filter((_, i) => i % step === 0);
    const trace1 = {
        x: displayData.map(d => `${d.year}-W${d.week}`),
        y: displayData.map(d => d.Cases),
        type: 'scatter', mode: 'lines+markers', name: 'Total Cases',
        line: { color: 'var(--primary)', width: 2 }, marker: { size: 5 }
    };
    const trace2 = {
        x: displayData.map(d => `${d.year}-W${d.week}`),
        y: displayData.map(d => d.count > 0 ? d.Cases_MA_3w / d.count : 0),
        type: 'scatter', mode: 'lines', name: '3-Week MA (Avg)',
        line: { color: '#00C49F', width: 2 }
    };
    const layout = {
        xaxis: { title: 'Time Period', tickangle: -45 },
        yaxis: { title: 'Cases' },
        hovermode: 'closest', showlegend: true,
        plot_bgcolor: 'var(--bg-light)', paper_bgcolor: 'white'
    };
    Plotly.newPlot('chart', [trace1, trace2], layout, {responsive: true});
}

function renderSeasonalPattern() {
    document.getElementById('chartTitle').textContent = '🌡️ Seasonal Pattern Analysis';
    const seasonalData = {};
    filteredData.forEach(d => {
        const week = d.week_of_outbreak;
        if (!week) return;
        if (!seasonalData[week]) {
            seasonalData[week] = { cases: [], seasonality: [] };
        }
        seasonalData[week].cases.push(d.Cases || 0);
        if (d.Seasonality_Index != null) {
            seasonalData[week].seasonality.push(d.Seasonality_Index);
        }
    });
    const weeks = Object.keys(seasonalData).map(Number).sort((a, b) => a - b);
    const avgCases = weeks.map(w => {
        const cases = seasonalData[w].cases;
        return cases.length > 0 ? cases.reduce((a, b) => a + b, 0) / cases.length : 0;
    });
    const avgSeasonality = weeks.map(w => {
        const seasonality = seasonalData[w].seasonality;
        return seasonality.length > 0 
            ? seasonality.reduce((a, b) => a + b, 0) / seasonality.length 
            : null;
    });
    const trace1 = {
        x: weeks.map(w => `Week ${w}`), y: avgCases,
        type: 'bar', name: 'Avg Cases', marker: { color: 'var(--primary)' }
    };
    const trace2 = {
        x: weeks.map(w => `Week ${w}`), y: avgSeasonality,
        type: 'scatter', mode: 'lines+markers', name: 'Seasonality Index',
        yaxis: 'y2', line: { color: '#FF8042', width: 3 },
        marker: { size: 6 }, connectgaps: true
    };
    const layout = {
        xaxis: { title: 'Week of Year', tickangle: -45 },
        yaxis: { title: 'Average Cases' },
        yaxis2: {
            title: 'Seasonality Index',
            overlaying: 'y', side: 'right'
        },
        showlegend: true, plot_bgcolor: 'var(--bg-light)'
    };
    Plotly.newPlot('chart', [trace1, trace2], layout, {responsive: true});
}

function renderDistrictComparison() {
    document.getElementById('chartTitle').textContent = `📊 District Comparison - ${currentMetric.replace(/_/g, ' ')}`;
    const districtData = {};
    filteredData.forEach(d => {
        const district = d.district;
        if (!district) return;
        if (!districtData[district]) {
            districtData[district] = {
                Cases: 0, Bed_Days: 0, ICU_Required: 0,
                Cases_MA_3w_sum: 0, Cases_trend_4w_sum: 0, count: 0
            };
        }
        districtData[district].Cases += d.Cases || 0;
        districtData[district].Bed_Days += d.Bed_Days || 0;
        districtData[district].ICU_Required += d.ICU_Required || 0;
        districtData[district].Cases_MA_3w_sum += d.Cases_MA_3w || 0;
        districtData[district].Cases_trend_4w_sum += d.Cases_trend_4w || 0;
        districtData[district].count++;
    });
    const plotData = Object.keys(districtData).map(district => {
        const data = districtData[district];
        let value;
        switch (currentMetric) {
            case 'Cases': value = data.Cases; break;
            case 'Bed_Days': value = data.Bed_Days; break;
            case 'ICU_Required': value = data.ICU_Required; break;
            case 'Cases_MA_3w': value = data.count > 0 ? (data.Cases_MA_3w_sum / data.count) : 0; break;
            case 'Cases_trend_4w': value = data.count > 0 ? (data.Cases_trend_4w_sum / data.count) : 0; break;
            default: value = data.Cases;
        }
        return { district: district, value: value };
    });
    plotData.sort((a, b) => b.value - a.value);
    const topData = plotData.slice(0, 30);
    const trace = {
        x: topData.map(d => d.district), y: topData.map(d => d.value),
        type: 'bar', name: currentMetric.replace(/_/g, ' '),
        marker: { color: 'var(--primary)', line: { color: '#4a5fc1', width: 1 } },
        text: topData.map(d => (Number.isInteger(d.value) ? d.value.toLocaleString() : d.value.toFixed(2))),
        hoverinfo: 'x+y'
    };
    const layout = {
        xaxis: { title: 'District', tickangle: -45, autorange: true },
        yaxis: { title: currentMetric.replace(/_/g, ' '), autorange: true },
        hovermode: 'closest', plot_bgcolor: 'var(--bg-light)', paper_bgcolor: 'white',
        margin: { l: 60, r: 30, b: 150, t: 40 },
        bargap: 0.15
    };
    Plotly.newPlot('chart', [trace], layout, {responsive: true});
}

function renderDiseasePie() {
    document.getElementById('chartTitle').textContent = '🥧 Disease Distribution (Total Cases)';
    const diseaseData = {};
    filteredData.forEach(d => {
        const disease = d.Disease_Clean || 'Unknown';
        if (!diseaseData[disease]) diseaseData[disease] = 0;
        diseaseData[disease] += d.Cases || 0;
    });
    const plotData = Object.keys(diseaseData).map(disease => ({
        disease: disease, cases: diseaseData[disease]
    }));
    plotData.sort((a, b) => b.cases - a.cases);
    const topN = 10;
    let labels, values;
    if (plotData.length > topN) {
        const topData = plotData.slice(0, topN);
        const otherCases = plotData.slice(topN).reduce((sum, d) => sum + d.cases, 0);
        labels = topData.map(d => d.disease);
        values = topData.map(d => d.cases);
        if (otherCases > 0) {
            labels.push('Other');
            values.push(otherCases);
        }
    } else {
        labels = plotData.map(d => d.disease);
        values = plotData.map(d => d.cases);
    }
    const trace = {
        labels: labels, values: values, type: 'pie',
        textinfo: 'percent+label', insidetextorientation: 'radial',
        automargin: true
    };
    const layout = {
        showlegend: true, height: 600,
        margin: { l: 20, r: 20, t: 40, b: 20 },
        paper_bgcolor: 'white'
    };
    Plotly.newPlot('chart', [trace], layout, {responsive: true});
}

function renderCorrelation() {
    document.getElementById('chartTitle').textContent = '🔗 Correlation Heatmap (Seasonal & Trend)';
    const districtData = {};
    filteredData.forEach(d => {
        const district = d.district;
        if (!district) return;
        if (!districtData[district]) {
            districtData[district] = { seasonality: [], trend: [] };
        }
        if (d.Seasonality_Index != null) districtData[district].seasonality.push(d.Seasonality_Index);
        if (d.Cases_trend_4w != null) districtData[district].trend.push(d.Cases_trend_4w);
    });
    const plotData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: 10, color: 'var(--primary)', opacity: 0.7 } };
    Object.keys(districtData).forEach(district => {
        const sData = districtData[district].seasonality;
        const tData = districtData[district].trend;
        if (sData.length > 0 && tData.length > 0) {
            const avgSeasonality = sData.reduce((a, b) => a + b, 0) / sData.length;
            const avgTrend = tData.reduce((a, b) => a + b, 0) / tData.length;
            plotData.x.push(avgSeasonality);
            plotData.y.push(avgTrend);
            plotData.text.push(district);
        }
    });
    const layout = {
        title: 'Avg Seasonality Index vs. Avg Trend (by District)',
        xaxis: { title: 'Average Seasonality Index' },
        yaxis: { title: 'Average 4-Week Trend' },
        hovermode: 'closest', plot_bgcolor: 'var(--bg-light)'
    };
    Plotly.newPlot('chart', [plotData], layout, {responsive: true});
}

function renderLagScatter() {
    document.getElementById('chartTitle').textContent = '📉 Lag Analysis (Cases vs. 1-Week Lag)';
    const plotData = {
        x: filteredData.map(d => d.Cases_lag_1w).filter(v => v != null),
        y: filteredData.map(d => d.Cases).filter((_, i) => filteredData[i].Cases_lag_1w != null),
        mode: 'markers', type: 'scatter', name: 'Cases',
        text: filteredData.map(d => `${d.district} ${d.year}-W${d.week_of_outbreak}`),
        marker: { size: 5, color: 'var(--primary)', opacity: 0.5 }
    };
    let x_sum = 0, y_sum = 0, xy_sum = 0, x_sq_sum = 0;
    const n = plotData.x.length;
    if (n > 1) {
        for (let i = 0; i < n; i++) {
            x_sum += plotData.x[i]; y_sum += plotData.y[i];
            xy_sum += plotData.x[i] * plotData.y[i];
            x_sq_sum += plotData.x[i] * plotData.x[i];
        }
        const m = (n * xy_sum - x_sum * y_sum) / (n * x_sq_sum - x_sum * x_sum);
        const b = (y_sum - m * x_sum) / n;
        const min_x = Math.min(...plotData.x);
        const max_x = Math.max(...plotData.x);
        const trendLine = {
            x: [min_x, max_x], y: [m * min_x + b, m * max_x + b],
            mode: 'lines', type: 'scatter', name: 'Trend Line',
            line: { color: '#FF8042', width: 3 }
        };
        Plotly.newPlot('chart', [plotData, trendLine], {
            xaxis: { title: 'Cases (Lag 1 Week)' }, yaxis: { title: 'Cases (Current Week)' },
            hovermode: 'closest', showlegend: true, plot_bgcolor: 'var(--bg-light)'
        }, {responsive: true});
    } else {
        Plotly.newPlot('chart', [plotData], {
            xaxis: { title: 'Cases (Lag 1 Week)' }, yaxis: { title: 'Cases (Current Week)' },
            hovermode: 'closest', showlegend: true, plot_bgcolor: 'var(--bg-light)'
        }, {responsive: true});
    }
}

function renderTrendBox() {
    document.getElementById('chartTitle').textContent = '📦 Trend Distribution by Disease';
    const diseaseData = {};
    filteredData.forEach(d => {
        const disease = d.Disease_Clean || 'Unknown';
        if (!diseaseData[disease]) diseaseData[disease] = [];
        if (d.Cases_trend_4w != null) diseaseData[disease].push(d.Cases_trend_4w);
    });
    const plotData = [];
    Object.keys(diseaseData).forEach(disease => {
        if (diseaseData[disease].length > 0) {
            plotData.push({
                y: diseaseData[disease], type: 'box',
                name: disease, boxpoints: 'Outliers'
            });
        }
    });
    const layout = {
        title: '4-Week Trend Distribution by Disease',
        yaxis: { title: 'Cases Trend (4-Week)' },
        xaxis: { title: 'Disease', tickangle: -45 },
        showlegend: false, plot_bgcolor: 'var(--bg-light)'
    };
    Plotly.newPlot('chart', plotData, layout, {responsive: true});
}

function renderHealthcare() {
    document.getElementById('chartTitle').textContent = `🏥 Healthcare Demand - ${currentMetric.replace(/_/g, ' ')}`;
    const sortedData = [...filteredData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (a.week_of_outbreak || 0) - (b.week_of_outbreak || 0);
    });
    const aggregatedData = {};
    sortedData.forEach(d => {
        const key = `${d.year}-W${d.week_of_outbreak}`;
        if (!aggregatedData[key]) {
            aggregatedData[key] = { 
                Cases: 0, Bed_Days: 0, ICU_Required: 0, 
                Cases_MA_3w: 0, Cases_trend_4w: 0,
                count: 0, year: d.year, week: d.week_of_outbreak 
            };
        }
        aggregatedData[key].Cases += d.Cases || 0;
        aggregatedData[key].Bed_Days += d.Bed_Days || 0;
        aggregatedData[key].ICU_Required += d.ICU_Required || 0;
        aggregatedData[key].Cases_MA_3w += d.Cases_MA_3w || 0;
        aggregatedData[key].Cases_trend_4w += d.Cases_trend_4w || 0;
        aggregatedData[key].count++;
    });
    const plotData = Object.values(aggregatedData).sort((a, b) => {
         if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
    });
    let yData, yTitle;
    switch (currentMetric) {
        case 'Bed_Days': yData = plotData.map(d => d.Bed_Days); yTitle = 'Total Bed Days'; break;
        case 'ICU_Required': yData = plotData.map(d => d.ICU_Required); yTitle = 'Total ICU Required'; break;
        case 'Cases_MA_3w': yData = plotData.map(d => d.count > 0 ? d.Cases_MA_3w / d.count : 0); yTitle = 'Avg 3-Week MA'; break;
        case 'Cases_trend_4w': yData = plotData.map(d => d.count > 0 ? d.Cases_trend_4w / d.count : 0); yTitle = 'Avg 4-Week Trend'; break;
        default: yData = plotData.map(d => d.Cases); yTitle = 'Total Cases';
    }
    const trace = {
        x: plotData.map(d => `${d.year}-W${d.week}`), y: yData,
        type: 'bar', name: yTitle, marker: { color: 'var(--primary)' }
    };
    let traces = [trace];
    if (currentMetric === 'Cases') {
        const traceBedDays = {
             x: plotData.map(d => `${d.year}-W${d.week}`),
             y: plotData.map(d => d.Bed_Days),
             type: 'scatter', mode: 'lines', name: 'Bed Days',
             yaxis: 'y2', line: { color: '#FF8042', width: 2 }
        };
        traces.push(traceBedDays);
    }
    const layout = {
        xaxis: { title: 'Time Period', tickangle: -45 },
        yaxis: { title: yTitle },
        hovermode: 'closest', showlegend: true,
        plot_bgcolor: 'var(--bg-light)', barmode: 'group',
        yaxis2: {
            title: 'Bed Days', overlaying: 'y',
            side: 'right', showgrid: false
        }
    };
    if (traces.length === 1) delete layout.yaxis2;
    Plotly.newPlot('chart', traces, layout, {responsive: true});
}

// ============================================================================
// RESOURCE SIMULATOR FUNCTIONS
// ============================================================================

async function handleRunSimulation() {
    setButtonLoading(btnRunSimulation, true);
    btnExportReport.style.display = 'none';
    
    const district = document.getElementById('resource-districtFilter').value;
    const disease = document.getElementById('resource-diseaseFilter').value;
    const availableBeds = parseInt(document.getElementById('resource-beds').value) || 0;
    const icuCapacity = parseInt(document.getElementById('resource-icu').value) || 0;
    const growthRate = parseFloat(document.getElementById('resource-growth').value) || 0;
    const weeksToSimulate = parseInt(document.getElementById('resource-weeks').value) || 12;
    
    if (!district || !disease) {
        resourceChartTitle.textContent = '⚠️ Please Select Both District and Disease';
        resourceChartContent.innerHTML = '<p style="text-align: center; color: var(--text-light);">Both district and disease must be selected to run the simulation.</p>';
        setButtonLoading(btnRunSimulation, false);
        return;
    }
    
    resourceChartTitle.textContent = '⏳ Running Simulation...';
    resourceChartContent.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // Filter historical data for the selected district and disease
        const historicalData = rawData.filter(d => 
            d.district === district && d.Disease_Clean === disease
        );
        
        if (historicalData.length === 0) {
            throw new Error('No historical data found for this combination');
        }
        
        // Calculate baseline metrics
        const avgCases = historicalData.reduce((sum, d) => sum + (d.Cases || 0), 0) / historicalData.length;
        const avgBedDays = historicalData.reduce((sum, d) => sum + (d.Bed_Days || 0), 0) / historicalData.length;
        const avgICU = historicalData.reduce((sum, d) => sum + (d.ICU_Required || 0), 0) / historicalData.length;
        const bedDaysPerCase = avgBedDays / (avgCases || 1);
        const icuRatio = avgICU / (avgCases || 1);
        
        // Run simulation
        const simulation = [];
        let currentCases = avgCases;
        
        for (let week = 1; week <= weeksToSimulate; week++) {
            currentCases = currentCases * (1 + growthRate / 100);
            const projectedBedDays = currentCases * bedDaysPerCase;
            const projectedICU = currentCases * icuRatio;
            
            simulation.push({
                week: week,
                cases: Math.round(currentCases),
                bedDays: Math.round(projectedBedDays),
                icuRequired: Math.round(projectedICU),
                bedCapacity: availableBeds,
                icuCapacity: icuCapacity,
                bedUtilization: (projectedBedDays / availableBeds) * 100,
                icuUtilization: (projectedICU / icuCapacity) * 100
            });
        }
        
        // Store results for export
        simulationResults = {
            district,
            disease,
            simulation,
            parameters: { availableBeds, icuCapacity, growthRate, weeksToSimulate },
            baseline: { avgCases, avgBedDays, avgICU }
        };
        
        // Display results
        displaySimulationResults(simulationResults);
        btnExportReport.style.display = 'inline-block';
        
    } catch (error) {
        console.error('Simulation error:', error);
        resourceChartTitle.textContent = '❌ Simulation Failed';
        resourceChartContent.innerHTML = `
            <p style="text-align: center; color: var(--text-light);">
                ${error.message}
            </p>
        `;
    }
    
    setButtonLoading(btnRunSimulation, false);
}

function displaySimulationResults(results) {
    const { district, disease, simulation, parameters, baseline } = results;
    
    resourceChartTitle.textContent = `🏥 Resource Simulation: ${district} - ${disease}`;
    resourceChartContent.innerHTML = '';
    
    // Find critical weeks
    const bedCritical = simulation.find(s => s.bedUtilization > 100);
    const icuCritical = simulation.find(s => s.icuUtilization > 100);
    
    // Create summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'simulation-summary';
    summaryDiv.innerHTML = `
        <h3>📊 Simulation Summary</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <strong>Baseline (Historical Avg):</strong><br>
                Cases: ${Math.round(baseline.avgCases)} | Bed Days: ${Math.round(baseline.avgBedDays)} | ICU: ${Math.round(baseline.avgICU)}
            </div>
            <div class="summary-item ${bedCritical ? 'critical' : 'safe'}">
                <strong>🛏️ Bed Capacity:</strong><br>
                ${bedCritical ? `⚠️ Capacity exceeded in Week ${bedCritical.week}` : '✅ Sufficient for entire period'}
            </div>
            <div class="summary-item ${icuCritical ? 'critical' : 'safe'}">
                <strong>🏥 ICU Capacity:</strong><br>
                ${icuCritical ? `⚠️ Capacity exceeded in Week ${icuCritical.week}` : '✅ Sufficient for entire period'}
            </div>
        </div>
    `;
    resourceChartContent.appendChild(summaryDiv);
    
    // Create charts container
    const chartsDiv = document.createElement('div');
    chartsDiv.innerHTML = `
        <div id="simulationChart1" style="width:100%; height:400px; margin-top: 20px;"></div>
        <div id="simulationChart2" style="width:100%; height:400px; margin-top: 20px;"></div>
    `;
    resourceChartContent.appendChild(chartsDiv);
    
    // Chart 1: Cases and Bed Days projection
    const trace1 = {
        x: simulation.map(s => `Week ${s.week}`),
        y: simulation.map(s => s.cases),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Projected Cases',
        line: { color: '#4a90e2', width: 3 }
    };
    
    const trace2 = {
        x: simulation.map(s => `Week ${s.week}`),
        y: simulation.map(s => s.bedDays),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Projected Bed Days',
        yaxis: 'y2',
        line: { color: '#f39c12', width: 3 }
    };
    
    const layout1 = {
        title: 'Projected Cases and Bed Days Demand',
        xaxis: { title: 'Week' },
        yaxis: { title: 'Cases', side: 'left' },
        yaxis2: { title: 'Bed Days', overlaying: 'y', side: 'right' },
        hovermode: 'x unified',
        showlegend: true
    };
    
    Plotly.newPlot('simulationChart1', [trace1, trace2], layout1, {responsive: true});
    
    // Chart 2: Capacity utilization
    const trace3 = {
        x: simulation.map(s => `Week ${s.week}`),
        y: simulation.map(s => s.bedUtilization),
        type: 'bar',
        name: 'Bed Utilization %',
        marker: { 
            color: simulation.map(s => s.bedUtilization > 100 ? '#e74c3c' : '#27ae60')
        }
    };
    
    const trace4 = {
        x: simulation.map(s => `Week ${s.week}`),
        y: simulation.map(s => s.icuUtilization),
        type: 'bar',
        name: 'ICU Utilization %',
        marker: { 
            color: simulation.map(s => s.icuUtilization > 100 ? '#e74c3c' : '#3498db')
        }
    };
    
    const layout2 = {
        title: 'Resource Utilization (%)',
        xaxis: { title: 'Week' },
        yaxis: { title: 'Utilization %' },
        hovermode: 'x unified',
        barmode: 'group',
        shapes: [{
            type: 'line',
            x0: 0,
            x1: 1,
            xref: 'paper',
            y0: 100,
            y1: 100,
            line: { color: 'red', width: 2, dash: 'dash' }
        }]
    };
    
    Plotly.newPlot('simulationChart2', [trace3, trace4], layout2, {responsive: true});
}

function handleExportReport() {
    if (!simulationResults) return;
    
    const { district, disease, simulation, parameters, baseline } = simulationResults;
    
    // Create CSV content
    let csv = 'Disease Outbreak Resource Simulation Report\n\n';
    csv += `District:,${district}\n`;
    csv += `Disease:,${disease}\n`;
    csv += `Simulation Date:,${new Date().toLocaleDateString()}\n\n`;
    
    csv += 'Parameters:\n';
    csv += `Available Beds:,${parameters.availableBeds}\n`;
    csv += `ICU Capacity:,${parameters.icuCapacity}\n`;
    csv += `Growth Rate:,${parameters.growthRate}%\n`;
    csv += `Weeks Simulated:,${parameters.weeksToSimulate}\n\n`;
    
    csv += 'Baseline Metrics (Historical Average):\n';
    csv += `Average Cases:,${Math.round(baseline.avgCases)}\n`;
    csv += `Average Bed Days:,${Math.round(baseline.avgBedDays)}\n`;
    csv += `Average ICU Required:,${Math.round(baseline.avgICU)}\n\n`;
    
    csv += 'Simulation Results:\n';
    csv += 'Week,Projected Cases,Bed Days Required,ICU Required,Bed Utilization %,ICU Utilization %\n';
    simulation.forEach(s => {
        csv += `${s.week},${s.cases},${s.bedDays},${s.icuRequired},${s.bedUtilization.toFixed(1)},${s.icuUtilization.toFixed(1)}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource_simulation_${district}_${disease}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}


// ============================================================================
// TIMELINE ANIMATION FUNCTIONS
// ============================================================================

function handleTimelinePlay() {
    const disease = document.getElementById('timeline-diseaseFilter').value;
    const metric = document.getElementById('timeline-metric').value;
    const speed = parseInt(document.getElementById('timeline-speed').value);
    
    // Prepare animation data
    prepareAnimationData(disease, metric);
    
    if (!animationData || animationData.length === 0) {
        timelineChartTitle.textContent = '⚠️ No Data Available';
        timelineChartContent.innerHTML = '<p style="text-align: center; color: var(--text-light);">No data available for the selected filters.</p>';
        return;
    }
    
    // Show progress bar and controls
    timelineProgress.style.display = 'block';
    btnTimelinePlay.style.display = 'none';
    btnTimelinePause.style.display = 'inline-block';
    
    // Clear previous content
    timelineChartContent.innerHTML = '';
    timelineChartContent.classList.remove('ml-welcome');
    
    // Start animation
    currentAnimationFrame = 0;
    startAnimation(speed);
}

function handleTimelinePause() {
    stopAnimation();
    btnTimelinePlay.style.display = 'inline-block';
    btnTimelinePause.style.display = 'none';
}

function handleTimelineReset() {
    stopAnimation();
    currentAnimationFrame = 0;
    timelineProgress.style.display = 'none';
    btnTimelinePlay.style.display = 'inline-block';
    btnTimelinePause.style.display = 'none';
    
    timelineChartTitle.textContent = 'Outbreak Evolution Over Time';
    timelineChartContent.innerHTML = `
        <div class="ml-welcome">
            <h2>Welcome to the Timeline Animation</h2>
            <p>
                • Select a <strong>disease</strong> (or view all)<br>
                • Choose the <strong>metric</strong> to visualize<br>
                • Adjust the <strong>animation speed</strong><br>
                • Click <strong>Play</strong> to watch the outbreak evolution across districts
            </p>
        </div>
    `;
}

function prepareAnimationData(disease, metric) {
    // Filter data based on disease selection
    let dataToAnimate = disease === 'All' ? rawData : rawData.filter(d => d.Disease_Clean === disease);
    
    // Sort by year and week
    dataToAnimate = dataToAnimate.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (a.week_of_outbreak || 0) - (b.week_of_outbreak || 0);
    });
    
    // Group by time period (year-week)
    const timeGroups = {};
    dataToAnimate.forEach(d => {
        const key = `${d.year}-W${d.week_of_outbreak}`;
        if (!timeGroups[key]) {
            timeGroups[key] = {
                year: d.year,
                week: d.week_of_outbreak,
                label: key,
                districts: {}
            };
        }
        
        const district = d.district;
        if (!timeGroups[key].districts[district]) {
            timeGroups[key].districts[district] = {
                Cases: 0,
                Bed_Days: 0,
                ICU_Required: 0
            };
        }
        
        timeGroups[key].districts[district].Cases += d.Cases || 0;
        timeGroups[key].districts[district].Bed_Days += d.Bed_Days || 0;
        timeGroups[key].districts[district].ICU_Required += d.ICU_Required || 0;
    });
    
    // Convert to array and store
    animationData = Object.values(timeGroups);
    
    console.log(`Animation prepared: ${animationData.length} time periods`);
}

function startAnimation(speed) {
    if (animationInterval) clearInterval(animationInterval);
    
    animationInterval = setInterval(() => {
        if (currentAnimationFrame >= animationData.length) {
            stopAnimation();
            btnTimelinePlay.style.display = 'inline-block';
            btnTimelinePause.style.display = 'none';
            return;
        }
        
        renderAnimationFrame(currentAnimationFrame);
        currentAnimationFrame++;
        
    }, speed);
}

function stopAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

function renderAnimationFrame(frameIndex) {
    const frame = animationData[frameIndex];
    const metric = document.getElementById('timeline-metric').value;
    const disease = document.getElementById('timeline-diseaseFilter').value;
    
    // Update progress
    progressText.textContent = `${frame.label} (${frameIndex + 1} of ${animationData.length})`;
    progressBar.style.width = `${((frameIndex + 1) / animationData.length) * 100}%`;
    
    // Prepare data for this frame
    const districts = Object.keys(frame.districts);
    const values = districts.map(d => {
        switch(metric) {
            case 'Cases': return frame.districts[d].Cases;
            case 'Bed_Days': return frame.districts[d].Bed_Days;
            case 'ICU_Required': return frame.districts[d].ICU_Required;
            default: return frame.districts[d].Cases;
        }
    });
    
    // Sort by value for better visualization
    const sorted = districts.map((d, i) => ({ district: d, value: values[i] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15); // Show top 15 districts
    
    const trace = {
        x: sorted.map(d => d.value),
        y: sorted.map(d => d.district),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: sorted.map(d => d.value),
            colorscale: 'Reds',
            showscale: true
        },
        text: sorted.map(d => d.value.toLocaleString()),
        textposition: 'outside',
        hoverinfo: 'x+y'
    };
    
    const layout = {
        title: `${metric.replace(/_/g, ' ')} - ${frame.label}${disease !== 'All' ? ' (' + disease + ')' : ''}`,
        xaxis: { 
            title: metric.replace(/_/g, ' '),
            autorange: true
        },
        yaxis: { 
            title: 'District',
            automargin: true
        },
        height: 600,
        margin: { l: 150, r: 50, t: 80, b: 80 },
        plot_bgcolor: 'var(--bg-light)',
        transition: {
            duration: 300,
            easing: 'cubic-in-out'
        }
    };
    
    Plotly.react('timelineChartContent', [trace], layout, {responsive: true});
}