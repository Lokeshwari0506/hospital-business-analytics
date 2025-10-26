import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import random # Using for mock data, remove later

# --- NEW IMPORTS (from your ML script) ---
import pandas as pd
import numpy as np
import warnings
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
import xgboost as xgb
import lightgbm as lgb
# -------------------------------------------

warnings.filterwarnings("ignore")

# --- ML Model Setup (TODO) ---
# ... (existing TODO block) ...
# -----------------------------


# Initialize the Flask app
app = Flask(__name__)
# Enable CORS
CORS(app)


# --- Mock Prediction Logic (for /predict endpoint) ---
# ... (existing get_mock_prediction function) ...
def get_mock_prediction(disease, district):
    """
    REPLACE THIS MOCK LOGIC with your real model.
    """
    print(f"Mock-predicting for Disease: {disease}, District: {district}")
    
    base = random.randint(50, 200)
    forecast = [
        base + random.randint(-10, 10),
        base + random.randint(0, 20),
        base + random.randint(10, 30),
        base + random.randint(20, 40)
    ]
    labels = ["Next Week", "Week 2", "Week 3", "Week 4"]
    
    return labels, forecast
# -----------------------------------------------


# --- NEW FUNCTION: MODEL COMPARISON PIPELINE ---
# (This is your entire script, converted into a function)
def run_model_comparison():
    """
    Runs the full model comparison pipeline and returns the results.
    """
    print("\n[Comparison] Loading dataset...")
    try:
        df = pd.read_csv("tamilnadu_data_enhanced_combined_strategy2_3.csv")
    except FileNotFoundError:
        print("[Comparison] ERROR: Data file not found.")
        raise
        
    print(f"[Comparison] Dataset loaded successfully! Shape: {df.shape}")

    # Drop/fill
    drop_cols = ['Unnamed: 0', 'Date', 'date'] if 'Unnamed: 0' in df.columns else []
    df.drop(columns=drop_cols, errors='ignore', inplace=True)
    df.fillna(0, inplace=True)

    target_col = 'Bed_Days'
    print(f"[Comparison] Forecasting Target: {target_col}")

    # Define features
    exclude_cols = ['Cases', 'district', 'Disease_Clean', 'state_ut', 'year', target_col]
    features = [col for col in df.columns if col not in exclude_cols]
    
    # Ensure all features are numeric and exist
    numeric_features = df[features].select_dtypes(include=[np.number]).columns
    X = df[numeric_features]
    y = df[target_col]

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split chronologically
    train_size = int(len(df) * 0.8)
    X_train, X_test = X_scaled[:train_size], X_scaled[train_size:]
    y_train, y_test = y.iloc[:train_size], y.iloc[train_size:]

    print(f"[Comparison] Training samples: {len(X_train)}, Testing samples: {len(X_test)}")

    # Define models
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42), # Reduced estimators for speed
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, random_state=42), # Reduced estimators
        # "Support Vector Regressor": SVR(kernel='rbf'), # SVR can be very slow, uncomment if needed
        "XGBoost": xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100, random_state=42),
        "LightGBM": lgb.LGBMRegressor(n_estimators=100, random_state=42)
    }

    # Evaluation metrics functions
    def mape(y_true, y_pred):
        return np.mean(np.abs((y_true - y_pred) / (y_true + 1e-10))) * 100

    def trend_accuracy(y_true, y_pred):
        actual_trend = np.sign(np.diff(y_true))
        pred_trend = np.sign(np.diff(y_pred))
        return np.mean(actual_trend == pred_trend) * 100

    # Train, evaluate, and compare
    results = []
    predictions = {} # To store predictions for the line chart

    for name, model in models.items():
        print(f"[Comparison] Training {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        predictions[name] = preds.tolist() # Convert to list for JSON

        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)
        mape_val = mape(y_test, preds)
        trend_acc = trend_accuracy(y_test.values, preds)

        results.append({
            "Model": name,
            "MAE": mae,
            "RMSE": rmse,
            "R²": r2,
            "MAPE (%)": mape_val,
            "Trend Accuracy": trend_acc
        })

    results_df = pd.DataFrame(results).sort_values(by="RMSE", ascending=True)
    print("[Comparison] MODEL COMPARISON RESULTS (FORECASTING)")
    print(results_df.round(4))
    
    # We return the results, not plot them
    return results_df, predictions, y_test
# -----------------------------------------------


@app.route('/predict', methods=['POST'])
def predict():
    """
    (Existing Endpoint) This is the API endpoint for SINGLE forecasts.
    """
    try:
        # ... (existing predict logic) ...
        data = request.json
        disease = data.get('disease')
        district = data.get('district')

        if not disease or not district:
            return jsonify({'error': 'Missing disease or district data'}), 400

        print(f"Received prediction request: Disease={disease}, District={district}")
        labels, forecast = get_mock_prediction(disease, district)

        response = {
            'success': True,
            'labels': labels,
            'forecast': forecast
        }
        return jsonify(response)

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': str(e)}), 500


# --- NEW ENDPOINT: MODEL COMPARISON ---
@app.route('/run_comparison', methods=['GET'])
def run_comparison_endpoint():
    """
    This endpoint runs the full ML pipeline and returns
    the comparison results and plot data.
    """
    try:
        print("Received request for /run_comparison")
        
        # This function now does all the heavy lifting
        results_df, predictions, y_test = run_model_comparison()
        
        # Add actuals to the predictions dict for plotting
        predictions['Actual'] = y_test.values.tolist()

        # Format for JSON response
        response = {
            'success': True,
            # Convert dataframe to JSON records
            'comparison_table': results_df.to_dict(orient='records'),
            # Send all plot data
            'plot_data': predictions
        }
        print("Comparison run successful, returning data.")
        return jsonify(response)
        
    except FileNotFoundError:
        return jsonify({'error': 'Data file not found on server. Please check file path.'}), 500
    except Exception as e:
        print(f"An error occurred during comparison: {e}")
        return jsonify({'error': str(e)}), 500
# ---------------------------------------


if __name__ == '__main__':
    print("Starting Python ML server at http://localhost:5000")
    app.run(debug=True, port=5000)

