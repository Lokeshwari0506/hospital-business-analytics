import json
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
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

warnings.filterwarnings("ignore")

# Initialize the Flask app with correct static folder
app = Flask(__name__, static_folder='static', template_folder='templates')
# Enable CORS
CORS(app)

# Global variables to store trained models and data
TRAINED_MODELS = {}
SCALER = None
FEATURE_COLUMNS = None
DATA_DF = None

def load_and_prepare_data():
    """
    Load the dataset and prepare it for predictions
    """
    global DATA_DF, SCALER, FEATURE_COLUMNS
    
    print("\n[INIT] Loading dataset...")
    try:
        DATA_DF = pd.read_csv("tamilnadu_data_enhanced_combined_strategy2_3.csv")
    except FileNotFoundError:
        print("[INIT] ERROR: Data file not found.")
        raise
        
    print(f"[INIT] Dataset loaded! Shape: {DATA_DF.shape}")
    
    # Clean data
    drop_cols = ['Unnamed: 0', 'Date', 'date'] if 'Unnamed: 0' in DATA_DF.columns else []
    DATA_DF.drop(columns=drop_cols, errors='ignore', inplace=True)
    DATA_DF.fillna(0, inplace=True)
    
    # Define features for modeling
    target_col = 'Bed_Days'
    exclude_cols = ['Cases', 'district', 'Disease_Clean', 'state_ut', 'year', target_col]
    features = [col for col in DATA_DF.columns if col not in exclude_cols]
    
    # Get numeric features only
    numeric_features = DATA_DF[features].select_dtypes(include=[np.number]).columns
    FEATURE_COLUMNS = numeric_features.tolist()
    
    print(f"[INIT] Features for modeling: {len(FEATURE_COLUMNS)}")
    return True


def train_model_for_prediction(disease, district):
    """
    Train a model specifically for the given disease and district
    Returns trained model and prepared data
    """
    global DATA_DF, SCALER, FEATURE_COLUMNS
    
    print(f"\n[TRAIN] Training model for Disease: {disease}, District: {district}")
    
    # Filter data for specific disease and district
    filtered_df = DATA_DF[
        (DATA_DF['Disease_Clean'] == disease) & 
        (DATA_DF['district'] == district)
    ].copy()
    
    if len(filtered_df) < 10:
        raise ValueError(f"Not enough data for {disease} in {district}. Only {len(filtered_df)} records found.")
    
    print(f"[TRAIN] Found {len(filtered_df)} records")
    
    # Sort by time
    filtered_df = filtered_df.sort_values(['year', 'week_of_outbreak'])
    
    # Prepare features and target
    X = filtered_df[FEATURE_COLUMNS]
    y = filtered_df['Bed_Days']
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Use 80% for training, keep last 20% for validation
    train_size = int(len(X_scaled) * 0.8)
    X_train = X_scaled[:train_size]
    y_train = y.iloc[:train_size]
    
    # Train a Gradient Boosting model (good balance of speed and accuracy)
    model = GradientBoostingRegressor(n_estimators=50, random_state=42)
    model.fit(X_train, y_train)
    
    print(f"[TRAIN] Model trained successfully")
    
    # Get the most recent data point for forecasting
    last_record = filtered_df.iloc[-1:][FEATURE_COLUMNS]
    
    return model, scaler, last_record, filtered_df


def forecast_next_week(model, scaler, last_record, historical_data, weeks_ahead=4):
    """
    Forecast the next N weeks using the trained model
    """
    predictions = []
    current_features = last_record.copy()
    
    # Get historical bed days for trend calculation
    recent_bed_days = historical_data['Bed_Days'].tail(10).values
    
    for week in range(weeks_ahead):
        # Scale the features
        scaled_features = scaler.transform(current_features)
        
        # Make prediction
        pred = model.predict(scaled_features)[0]
        predictions.append(max(0, pred))  # Ensure non-negative predictions
        
        # Update features for next iteration (simple approach)
        # In a real scenario, you'd update time-based features more intelligently
        current_features = current_features.copy()
        
        # Update lag features if they exist
        if 'Cases_lag_1w' in current_features.columns:
            if 'Cases_lag_2w' in current_features.columns:
                current_features['Cases_lag_2w'] = current_features['Cases_lag_1w'].values
            current_features['Cases_lag_1w'] = pred * 0.1  # Rough estimate based on bed days
        
        # Update moving averages if they exist
        if 'Cases_MA_3w' in current_features.columns:
            recent_bed_days = np.append(recent_bed_days[1:], pred)
            current_features['Cases_MA_3w'] = np.mean(recent_bed_days[-3:])
        
        if 'Cases_MA_4w' in current_features.columns:
            current_features['Cases_MA_4w'] = np.mean(recent_bed_days[-4:])
    
    return predictions


@app.route('/predict', methods=['POST'])
def predict():
    """
    API endpoint for SINGLE forecasts using actual data
    """
    try:
        data = request.json
        disease = data.get('disease')
        district = data.get('district')

        if not disease or not district:
            return jsonify({'error': 'Missing disease or district data'}), 400

        print(f"\n[PREDICT] Received request: Disease={disease}, District={district}")
        
        # Train model for this specific disease/district
        model, scaler, last_record, historical_data = train_model_for_prediction(disease, district)
        
        # Forecast next 4 weeks
        forecast = forecast_next_week(model, scaler, last_record, historical_data, weeks_ahead=4)
        
        labels = ["Week +1", "Week +2", "Week +3", "Week +4"]
        
        # Round predictions for better readability
        forecast = [round(f, 1) for f in forecast]
        
        print(f"[PREDICT] Forecast generated: {forecast}")

        response = {
            'success': True,
            'labels': labels,
            'forecast': forecast,
            'historical_average': round(historical_data['Bed_Days'].mean(), 1),
            'data_points_used': len(historical_data)
        }
        return jsonify(response)

    except ValueError as ve:
        print(f"[PREDICT] Validation error: {ve}")
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[PREDICT] An error occurred: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


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
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
        "XGBoost": xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100, random_state=42),
        "LightGBM": lgb.LGBMRegressor(n_estimators=100, random_state=42, verbose=-1)
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
    predictions = {}

    for name, model in models.items():
        print(f"[Comparison] Training {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        predictions[name] = preds.tolist()

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
    
    return results_df, predictions, y_test


@app.route('/run_comparison', methods=['GET'])
def run_comparison_endpoint():
    """
    This endpoint runs the full ML pipeline and returns
    the comparison results and plot data.
    """
    try:
        print("Received request for /run_comparison")
        
        results_df, predictions, y_test = run_model_comparison()
        
        # Add actuals to the predictions dict for plotting
        predictions['Actual'] = y_test.values.tolist()

        # Format for JSON response
        response = {
            'success': True,
            'comparison_table': results_df.to_dict(orient='records'),
            'plot_data': predictions
        }
        print("Comparison run successful, returning data.")
        return jsonify(response)
        
    except FileNotFoundError:
        return jsonify({'error': 'Data file not found on server. Please check file path.'}), 500
    except Exception as e:
        print(f"An error occurred during comparison: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# Initialize data when server starts
try:
    load_and_prepare_data()
    print("\n Server initialized successfully!")
except Exception as e:
    print(f"\n Error initializing server: {e}")
    print("Server will start but predictions may fail.")


@app.route('/')
def home():
    """Serve the main HTML interface."""
    return render_template('index.html')


if __name__ == '__main__':
    print("\n" + "="*60)
    print("Starting Python ML Server")
    print("="*60)
    print("Server URL: http://localhost:5000")
    print("Endpoints:")
    print("   - POST /predict (Single forecast)")
    print("   - GET  /run_comparison (Full model comparison)")
    print("="*60 + "\n")
    app.run(debug=False, port=5000)  # Changed to debug=True for better error messages
