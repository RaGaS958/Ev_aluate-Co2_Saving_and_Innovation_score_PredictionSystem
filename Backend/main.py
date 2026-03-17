"""
EV_aluate - FastAPI Backend
Run with: uvicorn main:app --reload
Ensure xgb.pkl, linear.pkl, columns.pkl, columns_linear.pkl are in same directory
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
import os

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EV_aluate API",
    description="Smart CO₂ & Innovation Score Prediction System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Constants ────────────────────────────────────────────────────────────────
INR_TO_EUR = 0.011
EUR_TO_INR = 1 / INR_TO_EUR

# ─── Model Loading ────────────────────────────────────────────────────────────
def load_models():
    try:
        base = os.path.dirname(os.path.abspath(__file__))
        xgb_model         = joblib.load(os.path.join(base, "xgb.pkl"))
        linear_model      = joblib.load(os.path.join(base, "linear.pkl"))
        co2_columns       = joblib.load(os.path.join(base, "columns.pkl"))
        innovation_columns = joblib.load(os.path.join(base, "columns_linear.pkl"))
        print("✅ All models loaded successfully")
        return xgb_model, linear_model, co2_columns, innovation_columns
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return None, None, None, None

xgb_model, linear_model, co2_columns, innovation_columns = load_models()

# ─── Schemas ──────────────────────────────────────────────────────────────────
class PredictionInput(BaseModel):
    battery:    float = Field(..., ge=20.0,  le=130.0,  description="Battery capacity (kWh)")
    efficiency: float = Field(..., ge=130.0, le=300.0,  description="Efficiency (Wh/km)")
    fast_charge: float = Field(..., ge=150.0, le=1300.0, description="Fast charge speed (km/h)")
    price:      float = Field(..., ge=1000.0,            description="Price (EUR or INR)")
    range_km:   float = Field(..., ge=130.0, le=700.0,   description="Range (km)")
    top_speed:  float = Field(..., ge=120.0, le=330.0,   description="Top speed (km/h)")
    currency:   str   = Field("EUR", description="Currency: EUR or INR")

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": xgb_model is not None and linear_model is not None,
        "version": "2.0.0"
    }


@app.post("/api/predict")
def predict(data: PredictionInput):
    if xgb_model is None or linear_model is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Ensure .pkl files exist.")

    price_eur = data.price * INR_TO_EUR if data.currency.upper() == "INR" else data.price

    all_data = {
        "Battery":    data.battery,
        "Efficiency": data.efficiency,
        "Fast_charge": data.fast_charge,
        "Price.DE.":  price_eur,
        "Range":      data.range_km,
        "Top_speed":  data.top_speed,
    }

    try:
        # CO₂ prediction
        co2_df    = pd.DataFrame([all_data])
        co2_df    = co2_df[[c for c in co2_columns if c in co2_df.columns]]
        co2_pred  = float(xgb_model.predict(co2_df)[0])

        # Innovation prediction
        inno_df   = pd.DataFrame([all_data])
        inno_df   = inno_df[[c for c in innovation_columns if c in inno_df.columns]]
        inno_pred = float(linear_model.predict(inno_df)[0])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    # ── Derived metrics ──
    tech_edge    = (data.fast_charge / 1300 * 0.5 + data.top_speed / 330 * 0.5) * 0.4
    energy_intel = (data.range_km / 700 * 0.6 + (1 - data.efficiency / 300) * 0.4) * 0.4
    user_value   = (1 - price_eur / 250000) * 0.2
    battery_eff  = (data.battery / data.range_km) * 100
    charge_index = data.fast_charge / data.battery
    co2_pct      = min((co2_pred / 50) * 100, 100)
    trees_eq     = co2_pred / 21
    petrol_saved = co2_pred / 2.31

    # ── Scatter context data ──
    np.random.seed(42)
    n = 50
    inno_samples = np.clip(np.random.normal(inno_pred, 0.05, n), 0, 1).tolist()
    co2_samples  = np.clip(np.random.normal(co2_pred, 2, n), 0, 100).tolist()

    return {
        "co2_savings":       round(co2_pred, 3),
        "innovation_score":  round(inno_pred, 4),
        "co2_percentage":    round(co2_pct, 2),
        "inno_percentage":   round(inno_pred * 100, 2),
        "trees_equivalent":  round(trees_eq, 2),
        "petrol_saved":      round(petrol_saved, 2),
        "tech_edge":         round(tech_edge / 0.4 * 100, 1),
        "energy_intel":      round(energy_intel / 0.4 * 100, 1),
        "user_value":        round(max(user_value, 0) / 0.2 * 100, 1),
        "battery_efficiency": round(battery_eff, 2),
        "charge_index":      round(charge_index, 2),
        "price_eur":         round(price_eur, 2),
        "context_innovation": inno_samples[:-1],
        "context_co2":       co2_samples[:-1],
        "currency_used":     data.currency.upper(),
    }


@app.get("/api/stats")
def get_stats():
    return {
        "model_metrics": {
            "co2": {
                "r2": 0.9957, "mae": 0.312, "rmse": 0.472,
                "cv_mean": 0.9938, "cv_std": 0.0029,
                "model_type": "XGBoost Regressor",
                "accuracy_pct": 99.57
            },
            "innovation": {
                "r2": 0.9904, "mae": 0.0066, "rmse": 0.0100,
                "cv_mean": 0.9924, "cv_std": 0.0017,
                "model_type": "Linear Regression",
                "accuracy_pct": 99.04
            }
        },
        "dataset": {
            "total_evs": 360,
            "features_co2": 5,
            "features_innovation": 6,
            "train_split": 0.8,
            "cv_folds": 5
        },
        "feature_importance": {
            "features": ["Range", "Battery", "Top Speed", "Fast Charge", "Price"],
            "co2_model":        [100, 88, 74, 71, 45],
            "innovation_model": [79, 85, 90, 84, 47]
        },
        "currency": {
            "eur_to_inr": round(EUR_TO_INR, 2),
            "inr_to_eur": INR_TO_EUR
        }
    }


@app.get("/api/analytics")
def get_analytics():
    # Training convergence simulation
    iters       = list(range(1, 101))
    co2_curve   = [round(0.85 + 0.1457 * (1 - np.exp(-i / 20)), 4)  for i in iters]
    inno_curve  = [round(0.88 + 0.1104 * (1 - np.exp(-i / 15)), 4)  for i in iters]

    return {
        "training_convergence": {
            "iterations":         iters,
            "co2_scores":         co2_curve,
            "innovation_scores":  inno_curve
        },
        "correlation_matrix": {
            "features": ["Battery", "Fast Charge", "Top Speed", "Range", "Efficiency", "Price"],
            "co2_savings":        [1.00, 0.65, 0.70, 0.85, 0.15, 0.55],
            "range_factor":       [0.88, 0.71, 0.74, 1.00, 0.08, 0.45],
            "innovation_score":   [0.85, 0.84, 0.90, 0.79, 0.08, 0.47]
        },
        "ev_segments": {
            "labels":         ["Economy", "Mid-Range", "Premium", "Luxury", "Performance"],
            "co2_avg":        [18.5, 28.3, 35.6, 40.2, 32.1],
            "innovation_avg": [0.42, 0.58, 0.72, 0.68, 0.81],
            "count":          [85, 120, 95, 35, 25]
        },
        "model_radar": {
            "categories": ["R² Score", "CV Mean", "Low MAE", "Low RMSE", "Consistency"],
            "co2_values": [
                round(0.9957 * 100, 2),
                round(0.9938 * 100, 2),
                round((1 - 0.312 / 10) * 100, 2),
                round((1 - 0.472 / 10) * 100, 2),
                round((1 - 0.0029) * 100, 2)
            ],
            "innovation_values": [
                round(0.9904 * 100, 2),
                round(0.9924 * 100, 2),
                round((1 - 0.0066 / 0.1) * 100, 2),
                round((1 - 0.0100 / 0.1) * 100, 2),
                round((1 - 0.0017) * 100, 2)
            ]
        }
    }
