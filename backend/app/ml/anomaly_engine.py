import math
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest

class EnsembleAnomalyDetector:
    def __init__(self):
        # Weights for different anomaly indicators
        self.weights = {
            "resting_heart_rate": 0.35,
            "spo2": 0.30,
            "hrv": 0.20,
            "respiratory_rate": 0.15
        }
        
    def detect_zscore(self, value: float, mean: float, std_dev: float, threshold: float = 2.5) -> Tuple[bool, float]:
        if std_dev <= 0.001:
            std_dev = 1.0
        z = (value - mean) / std_dev
        is_anomaly = abs(z) >= threshold
        return is_anomaly, z

    def detect_ewma(self, series: List[float], alpha: float = 0.3, threshold_stds: float = 2.5) -> Tuple[bool, float]:
        if len(series) < 3:
            return False, 0.0
        ewma = series[0]
        for val in series[1:]:
            ewma = alpha * val + (1 - alpha) * ewma
        latest = series[-1]
        residuals = [abs(x - ewma) for x in series]
        mean_res = sum(residuals) / len(residuals)
        diff = abs(latest - ewma)
        is_anomaly = diff > (threshold_stds * max(mean_res, 1.0))
        return is_anomaly, diff

    def detect_isolation_forest(self, recent_readings: List[Dict[str, float]]) -> Tuple[bool, float]:
        """Runs scikit-learn Isolation Forest on multi-metric vectors (HR, HRV, SpO2, RespRate)."""
        if len(recent_readings) < 10:
            return False, 0.0
            
        data = []
        for r in recent_readings:
            data.append([
                r.get("resting_heart_rate", 70.0),
                r.get("spo2", 98.0),
                r.get("hrv", 38.0),
                r.get("respiratory_rate", 16.0)
            ])
            
        X = np.array(data)
        clf = IsolationForest(contamination=0.08, random_state=42)
        clf.fit(X[:-1])  # fit on history
        pred = clf.predict([X[-1]])[0]  # -1 for anomaly, 1 for normal
        score = float(clf.decision_function([X[-1]])[0])
        return (pred == -1), score

    def apply_context_filter(
        self,
        metric: str,
        value: float,
        recent_steps: int,
        context_notes: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Suppresses false positives when changes are explained by physical exercise,
        active walking, or documented medication timings.
        """
        if metric in ["heart_rate", "resting_heart_rate"]:
            if recent_steps > 800:
                return True, "Elevated heart rate matches recent physical activity / steps"
        if context_notes and "exercise" in context_notes.lower():
            return True, "User logged physical activity"
        return False, None

    def calculate_risk_score(
        self,
        current_vitals: Dict[str, float],
        baselines: Dict[str, Dict[str, float]],
        recent_history: List[Dict[str, float]],
        recent_steps: int = 0
    ) -> Dict[str, Any]:
        """
        Calculates an explainable monitoring risk score from 0 to 100.
        0-24: Normal
        25-49: Watch
        50-74: Warning
        75-100: Critical
        """
        contributing_factors = []
        raw_risk = 0.0
        
        # 1. Resting Heart Rate Analysis
        rhr = current_vitals.get("resting_heart_rate", 70.0)
        base_rhr = baselines.get("resting_heart_rate", {"mean": 70.0, "std_dev": 4.0})
        is_rhr_anom, z_rhr = self.detect_zscore(rhr, base_rhr["mean"], base_rhr["std_dev"])
        dev_rhr_pct = round(((rhr - base_rhr["mean"]) / base_rhr["mean"]) * 100, 1)
        
        # Check context
        is_rhr_explained, rhr_ctx = self.apply_context_filter("resting_heart_rate", rhr, recent_steps)
        if not is_rhr_explained and dev_rhr_pct > 8.0:
            weight = min(40.0, max(0.0, (dev_rhr_pct - 5.0) * 2.2))
            raw_risk += weight
            contributing_factors.append({
                "metric": "resting_heart_rate",
                "observed": rhr,
                "baseline_mean": base_rhr["mean"],
                "deviation_pct": dev_rhr_pct,
                "weight": round(weight, 1),
                "detail": f"Resting HR is {abs(dev_rhr_pct)}% {'above' if dev_rhr_pct > 0 else 'below'} normal baseline."
            })
            
        # 2. SpO2 Analysis
        spo2 = current_vitals.get("spo2", 98.0)
        base_spo2 = baselines.get("spo2", {"mean": 98.0, "std_dev": 0.8})
        dev_spo2_pct = round(((spo2 - base_spo2["mean"]) / base_spo2["mean"]) * 100, 1)
        if spo2 < 95.0:
            weight = min(45.0, (96.0 - spo2) * 12.0)
            raw_risk += weight
            contributing_factors.append({
                "metric": "spo2",
                "observed": spo2,
                "baseline_mean": base_spo2["mean"],
                "deviation_pct": dev_spo2_pct,
                "weight": round(weight, 1),
                "detail": f"SpO2 decreased to {spo2}% (Normal personal baseline: {base_spo2['mean']}%)."
            })

        # 3. HRV Analysis
        hrv = current_vitals.get("hrv", 38.0)
        base_hrv = baselines.get("hrv", {"mean": 38.0, "std_dev": 5.0})
        dev_hrv_pct = round(((hrv - base_hrv["mean"]) / base_hrv["mean"]) * 100, 1)
        if dev_hrv_pct < -20.0:
            weight = min(25.0, abs(dev_hrv_pct) * 0.5)
            raw_risk += weight
            contributing_factors.append({
                "metric": "hrv",
                "observed": hrv,
                "baseline_mean": base_hrv["mean"],
                "deviation_pct": dev_hrv_pct,
                "weight": round(weight, 1),
                "detail": f"Heart rate variability decreased by {abs(dev_hrv_pct)}%, suggesting physiological stress."
            })

        # 4. Respiratory Rate Analysis
        rr = current_vitals.get("respiratory_rate", 16.0)
        base_rr = baselines.get("respiratory_rate", {"mean": 16.0, "std_dev": 1.5})
        dev_rr_pct = round(((rr - base_rr["mean"]) / base_rr["mean"]) * 100, 1)
        if dev_rr_pct > 20.0 or rr >= 22.0:
            weight = min(30.0, (rr - 18.0) * 5.0)
            raw_risk += weight
            contributing_factors.append({
                "metric": "respiratory_rate",
                "observed": rr,
                "baseline_mean": base_rr["mean"],
                "deviation_pct": dev_rr_pct,
                "weight": round(weight, 1),
                "detail": f"Respiratory rate elevated to {rr} breaths/min."
            })

        # Multi-metric compound multiplier (if multiple vitals deviate simultaneously)
        if len(contributing_factors) >= 2:
            raw_risk *= 1.25

        final_score = round(min(100.0, max(8.0, raw_risk)), 1)
        
        # Categorize
        if final_score >= 75.0:
            status = "Critical"
        elif final_score >= 50.0:
            status = "Warning"
        elif final_score >= 25.0:
            status = "Watch"
        else:
            status = "Normal"

        # Generate Plain-language Explanation
        if not contributing_factors:
            explanation = "All biometric readings match your personal 14-day learned health baselines. No unusual physiological deviation detected."
            suggested_action = "Continue regular daily activities and stay hydrated."
        else:
            primary_factor = contributing_factors[0]
            explanation = f"Detected a physiological shift: {primary_factor['detail']}"
            if len(contributing_factors) > 1:
                explanation += f" Accompanied by changes in {contributing_factors[1]['metric'].replace('_', ' ')}."
                
            if status == "Critical":
                suggested_action = "Rest immediately in a comfortable seated position. Inform your emergency contact or doctor if any discomfort occurs."
            elif status == "Warning":
                suggested_action = "Avoid physical exertion, rest, stay hydrated, and monitor your vitals. Alert caregiver if symptoms develop."
            else:
                suggested_action = "Consider a brief afternoon rest and stay hydrated. Continue regular monitoring."

        # Experimental 24-48h Trend Forecast
        forecast_direction = "stable"
        if final_score >= 50.0:
            forecast_direction = "elevated_risk_without_rest"
        elif final_score >= 25.0:
            forecast_direction = "watch_trajectory"
            
        trend_forecast = {
            "forecast_window_hours": 48,
            "direction": forecast_direction,
            "projected_range": [max(5.0, final_score - 8.0), min(95.0, final_score + 14.0)],
            "supporting_indicators": [f["metric"] for f in contributing_factors],
            "disclaimer": "EXPERIMENTAL PREDICTIVE TREND — NOT A CLINICAL DIAGNOSIS"
        }

        return {
            "score": final_score,
            "status": status,
            "explanation": explanation,
            "suggested_action": suggested_action,
            "contributing_factors": contributing_factors,
            "trend_forecast": trend_forecast
        }

anomaly_engine = EnsembleAnomalyDetector()
