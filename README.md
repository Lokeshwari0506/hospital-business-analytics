# 🏥 Disease Outbreak Predictive Analytics Dashboard

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()

> **An interactive web-based system for disease outbreak forecasting, resource capacity planning, and temporal outbreak visualization for Tamil Nadu, India.**

![Dashboard Preview](https://github.com/Lokeshwari0506/hospital-business-analytics/blob/main/screenshots-folder/Dashboard.jpg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Model Performance](#model-performance)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🎯 Overview

Disease outbreaks pose significant challenges to public health infrastructure, often overwhelming hospital capacity and straining medical resources. This project addresses these challenges by implementing **machine learning-based predictive analytics** to forecast disease outbreaks and healthcare resource requirements.

The system analyzes 10+ years of historical outbreak data from Tamil Nadu's 38 districts, covering 12+ disease types including Dengue, Malaria, Typhoid, and Chikungunya. It provides:

- **4-week ahead forecasts** of hospital bed days and ICU requirements
- **Resource capacity simulation** with configurable growth scenarios
- **Interactive visualizations** of outbreak patterns and trends
- **Temporal animations** showing disease evolution across districts

### 🎓 Academic Context

This project was developed as part of a **Predictive Analytics** coursework, demonstrating the practical application of:
- Time-series forecasting
- Ensemble machine learning methods
- RESTful API development
- Interactive data visualization
- Healthcare resource optimization

---

## Features

### 📊 1. Statistical Inference Module
- **Descriptive Analytics:** Total cases, district distribution, disease prevalence
- **8 Interactive Visualizations:**
  - Time series trends with moving averages
  - Seasonal pattern analysis
  - District-wise comparison bar charts
  - Disease distribution pie charts
  - Correlation heatmaps
  - Lag analysis scatter plots
  - Trend distribution box plots
  - Healthcare demand projections

### 🔮 2. ML Prediction Module
- **Single Disease-District Forecasting:**
  - Select specific district and disease
  - Get 4-week ahead bed day predictions
  - View historical baseline metrics
- **Model Comparison Pipeline:**
  - Trains 5 ML models simultaneously
  - Performance metrics table (MAE, RMSE, R², MAPE, Trend Accuracy)
  - Visual comparison charts

### 🏥 3. Resource Simulator
- **Capacity Planning Tool:**
  - Configure available beds and ICU capacity
  - Set expected growth rate (%)
  - Simulate 1-52 weeks ahead
- **Outputs:**
  - Week-by-week demand projections
  - Capacity breach warnings (e.g., "⚠️ Exceeded in Week 7")
  - Utilization percentage visualizations
  - Exportable CSV reports

### 🎬 4. Timeline Animation
- **Outbreak Evolution Visualization:**
  - Animated bar chart race across districts
  - Configurable metrics (Cases/Bed Days/ICU)
  - Adjustable playback speed (0.25s - 2s per frame)
  - Progress tracking with week indicators

---

## 🛠️ Technology Stack

### Backend
- **Python 3.10+**
- **Flask** - Web framework and REST API
- **Pandas** - Data manipulation
- **NumPy** - Numerical computations
- **Scikit-learn** - Machine learning models
- **XGBoost** - Gradient boosting
- **LightGBM** - Fast gradient boosting

### Frontend
- **HTML5 / CSS3** - Structure and styling
- **Vanilla JavaScript** - Interactivity
- **Plotly.js** - Interactive charts
- **PapaParse** - CSV parsing

### Machine Learning Models
1. Linear Regression (Baseline)
2. Random Forest Regressor
3. Gradient Boosting Regressor ⭐ (Best performer)
4. XGBoost Regressor
5. LightGBM Regressor

---

## 📦 Installation

### Prerequisites
- Python 3.10 or higher
- pip package manager
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/disease-outbreak-analytics.git
cd disease-outbreak-analytics
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Verify Folder Structure
```
disease-outbreak-analytics/
├── app.py
├── tamilnadu_data_enhanced_combined_strategy2_3.csv
├── templates/
│   └── index.html
├── static/
│   ├── styles.css
│   └── script.js
├── requirements.txt
└── README.md
```

### Step 5: Run Application
```bash
python app.py
```

The server will start at: **http://localhost:5000**

---

## 🚀 Usage

### 1. Upload Data
1. Click **"📁 Click to Upload File"**
2. Select the CSV file (`.csv`, `.txt`, or `.tsv`)
3. Wait for "✅ Successfully loaded" confirmation

### 2. Statistical Analysis
- Navigate to **"📈 Statistical Inference"** tab
- Use filters: Disease, District, Year, Month
- Select chart types (Time Series, Seasonal, etc.)
- View summary statistics cards

### 3. Run ML Predictions

#### Single Forecast:
1. Go to **"🔮 Prediction with ML Models"** tab
2. Select **Disease** and **District**
3. Click **"🔮 Run Single Forecast"**
4. View 4-week prediction chart

#### Model Comparison:
1. Click **"📊 Run Model Comparison"**
2. Wait 30-60 seconds for training
3. Review performance metrics table
4. Compare forecast vs actual line chart

### 4. Simulate Resources
1. Navigate to **"🏥 Resource Simulator"** tab
2. Select **District** and **Disease**
3. Input:
   - Available Beds (e.g., 100)
   - ICU Capacity (e.g., 20)
   - Growth Rate % (e.g., 10)
   - Weeks to Simulate (e.g., 12)
4. Click **"▶️ Run Simulation"**
5. Review capacity warnings and charts
6. Click **"📄 Export Report"** to download CSV

### 5. Watch Timeline Animation
1. Go to **"🎬 Timeline Animation"** tab
2. Select **Disease** (or "All")
3. Choose **Metric** (Cases/Bed Days/ICU)
4. Set **Animation Speed**
5. Click **"▶️ Play"**
6. Use **"⏸️ Pause"** or **"🔄 Reset"** controls

---

## 📁 Project Structure

```
disease-outbreak-analytics/
│
├── app.py                          # Flask backend server
│   ├── /predict                    # POST endpoint for single forecast
│   ├── /run_comparison             # GET endpoint for model comparison
│   └── /                           # Home route (serves index.html)
│
├── templates/
│   └── index.html                  # Main HTML dashboard
│
├── static/
│   ├── styles.css                  # Custom styling
│   └── script.js                   # Frontend logic
│       ├── File upload handler
│       ├── Filter population
│       ├── Chart rendering (8 types)
│       ├── ML API calls
│       ├── Resource simulation
│       └── Timeline animation
│
├── tamilnadu_data_enhanced_combined_strategy2_3.csv
│   └── Dataset (15,000+ records)
│
├── requirements.txt                # Python dependencies
├── README.md                       # This file
└── LICENSE                         # MIT License
```

---

## 🔌 API Endpoints

### 1. **POST /predict**
Generates 4-week forecast for specific disease-district combination.

**Request Body:**
```json
{
  "disease": "Dengue",
  "district": "Chennai"
}
```

**Response:**
```json
{
  "success": true,
  "labels": ["Week +1", "Week +2", "Week +3", "Week +4"],
  "forecast": [245.3, 278.1, 312.5, 289.7],
  "historical_average": 220.5,
  "data_points_used": 156
}
```

### 2. **GET /run_comparison**
Runs full ML pipeline comparing 5 models on entire dataset.

**Response:**
```json
{
  "success": true,
  "comparison_table": [
    {
      "Model": "Gradient Boosting",
      "MAE": 28.1,
      "RMSE": 42.3,
      "R²": 0.89,
      "MAPE (%)": 16.4,
      "Trend Accuracy": 82.1
    },
    ...
  ],
  "plot_data": {
    "Actual": [245, 278, ...],
    "Gradient Boosting": [238, 265, ...],
    ...
  }
}
```

---

## 📊 Model Performance

| Model | MAE | RMSE | R² | MAPE (%) | Trend Accuracy |
|-------|-----|------|-----|----------|----------------|
| Linear Regression | 9.69	|11.97	|0.98	|16730314976|	86.3|
| Random Forest |10.96	|27.59|	0.93|	8707483006	|85.61|
| Gradient Boosting | 11.78|	30.5|	0.92|	1.44857E+11|	86.98|
| XGBoost | 11.99|	30.46|	0.92|	1.50E+11|	86.3 |
| LightGBM | 20.69|	44.25|	0.83|	2.49E+11|	83.56 |



### Feature Importance (Top 5)
1. **Seasonality Index**
2. **Cases_MA_3w** (28%) - 3-week moving average
3. **Cases_lag_1w** (22%) - Previous week's cases
4. **Seasonality_Index** (18%) - Seasonal pattern strength
5. **Cases_trend_4w** (15%) - 4-week trend direction
6. **week_of_outbreak** (12%) - Time of year

---

## 📸 Screenshots

### Dashboard Home
![Dashboard](https://github.com/Lokeshwari0506/hospital-business-analytics/blob/main/screenshots-folder/Dashboard.jpg)

### Statistical Analysis
![Statistics](https://github.com/Lokeshwari0506/hospital-business-analytics/blob/main/screenshots-folder/Statistical%20Inference.jpg)

### ML Predictions
![ML Predictions](https://github.com/Lokeshwari0506/hospital-business-analytics/blob/main/screenshots-folder/ML%20tab_single%20Forecast.jpg)

### Resource Simulator
![Resource Simulator](https://github.com/Lokeshwari0506/hospital-business-analytics/blob/main/screenshots-folder/Simulator.jpg)

### Timeline Animation
![Timeline Animation](https://github.com/Lokeshwari0506/hospital-business-analytics/blob/main/screenshots-folder/TImeline%20Animation.jpg)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
4. **Push to branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow PEP 8 for Python code
- Use meaningful variable names
- Add comments for complex logic
- Update documentation for new features
- Test all endpoints before submitting PR

---

## 🐛 Known Issues & Limitations

1. **Forecast Horizon:** Limited to 4 weeks (accuracy degrades beyond)
2. **Training Time:** Model comparison takes 30-60 seconds
3. **Data Dependency:** Requires manual CSV upload (no real-time API integration)
4. **Browser Compatibility:** Best viewed in Chrome/Firefox (IE not supported)
5. **Mobile Responsiveness:** Dashboard optimized for desktop (>1024px width)

---


## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 📧 Contact

**Author:** LOKESHWARI G  
**Email:** lokeshwarig2005@gmail.com 
**GitHub:** [@Lokeshwari0506](https://github.com/Lokeshwari0506)  
**LinkedIn:** [My LinkedIn]( linkedin.com/in/lokeshwari-g-50b336275/)

**Project Link:** [https://github.com/Lokeshwari0506/hospital-business-analytics](https://github.com/Lokeshwari0506/hospital-business-analytics)

---

## 🙏 Acknowledgments

- **Dataset:** [Dataset Link]( https://zenodo.org/records/14580510)
- **Libraries:** Scikit-learn, Flask, Plotly.js communities
- **Inspiration:** WHO Disease Outbreak News

---

## ⭐ Star this Repository

If you found this project helpful, please consider giving it a star! It helps others discover the project.

[![GitHub stars](https://img.shields.io/github/stars/Lokeshwari0506/hospital-business-analytics?style=social)](https://github.com/Lokeshwari0506/hospital-business-analytics/stargazers)

---

**Built with ❤️ for better healthcare decision-making**

