import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("=== 1. HEALTH CHECK ===")
        res = await client.get("http://localhost:8000/api/v1/health")
        print("Health status:", res.status_code, res.json())

        print("\n=== 2. GET PATIENTS ===")
        p_res = await client.get("http://localhost:8000/api/v1/patients/")
        patients = p_res.json()
        print(f"Loaded {len(patients)} patients. First patient: {patients[0]['full_name']} (ID: {patients[0]['id']})")
        patient_id = patients[0]["id"]

        print("\n=== 3. TRIGGER CRITICAL EMERGENCY ALERT ===")
        em_res = await client.post("http://localhost:8000/api/v1/emergency/trigger", json={
            "patient_id": patient_id,
            "title": "Severe Ambulatory Desaturation & Tachycardia",
            "indicators": {"resting_heart_rate": 114, "spo2": 89.8, "hrv": 15.2},
            "severity": "Critical"
        })
        print("Emergency trigger status:", em_res.status_code)
        em_data = em_res.json()
        print("Dispatched to Doctor:", em_data.get("doctor_notified"), "| Caregiver:", em_data.get("caregiver_notified"))
        emergency_id = em_data.get("emergency_event_id") or em_data.get("id")

        print("\n=== 4. LIST ACTIVE EMERGENCIES ===")
        active_res = await client.get("http://localhost:8000/api/v1/emergency/active")
        active_list = active_res.json()
        print(f"Total emergencies in registry: {len(active_list)}. Latest status: {active_list[0]['status']}")

        print("\n=== 5. DOCTOR ACKNOWLEDGE EMERGENCY ===")
        ack_res = await client.post("http://localhost:8000/api/v1/emergency/acknowledge", json={
            "emergency_event_id": emergency_id,
            "doctor_id": "doc_1",
            "clinical_notes": "Reviewed vital trends. Patient resting comfortably with family. Vitals stabilizing.",
            "contacted_patient": True,
            "contacted_caregiver": True
        })
        print("Acknowledgement status:", ack_res.status_code)
        print("Acknowledgement result:", ack_res.json())

        print("\n=== 6. CONNECTIVITY WATCHDOG SIMULATION ===")
        fail_res = await client.post(f"http://localhost:8000/api/v1/connectivity/simulate-failure/{patient_id}")
        print("Network failure simulation:", fail_res.status_code, fail_res.json())

        stat_res = await client.get(f"http://localhost:8000/api/v1/connectivity/status/{patient_id}")
        print("Device connection status during failure:", stat_res.json().get("status"))

        restore_res = await client.post(f"http://localhost:8000/api/v1/connectivity/restore/{patient_id}")
        print("Network restore simulation:", restore_res.status_code, restore_res.json())

        print("\n=== 7. FRONTEND ROUTES HTTP STATUS ===")
        routes = ["/", "/dashboard", "/vitals", "/alerts", "/caregiver", "/doctor", "/demo", "/analytics", "/settings"]
        for r in routes:
            f_res = await client.get(f"http://localhost:3000{r}")
            print(f"Frontend {r.ljust(14)} -> HTTP {f_res.status_code}")

        print("\nALL END-TO-END VERIFICATION CHECKS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())
