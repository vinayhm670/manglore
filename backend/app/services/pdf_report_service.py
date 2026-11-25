import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.entities import Patient, User, VitalReading, HealthBaseline, Alert, SymptomLog

async def generate_clinical_pdf_report(db: AsyncSession, patient_id: str) -> bytes:
    # 1. Fetch Patient & User
    q_pat = await db.execute(
        select(Patient, User).join(User, Patient.user_id == User.id).where(Patient.id == patient_id)
    )
    row = q_pat.first()
    if not row:
        raise ValueError("Patient not found")
    pat, u = row

    # 2. Fetch Latest 10 Vitals
    q_vitals = await db.execute(
        select(VitalReading).where(VitalReading.patient_id == patient_id).order_by(desc(VitalReading.timestamp)).limit(10)
    )
    vitals = q_vitals.scalars().all()

    # 3. Fetch Baselines
    q_base = await db.execute(select(HealthBaseline).where(HealthBaseline.patient_id == patient_id))
    baselines = q_base.scalars().all()

    # 4. Fetch Alerts
    q_alerts = await db.execute(
        select(Alert).where(Alert.patient_id == patient_id).order_by(desc(Alert.timestamp)).limit(5)
    )
    alerts = q_alerts.scalars().all()

    # 5. Fetch Symptoms
    q_sym = await db.execute(
        select(SymptomLog).where(SymptomLog.patient_id == patient_id).order_by(desc(SymptomLog.timestamp)).limit(5)
    )
    symptoms = q_sym.scalars().all()

    # Create PDF buffer
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#102D35")
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#087F70")
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#102D35"),
        spaceBefore=10,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        "BodySmall",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#18332F")
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#667B75")
    )

    # Header Banner
    story.append(Paragraph("PULSEORA — Clinical Biometric Telemetry Report", title_style))
    story.append(Paragraph("Nitte Pharma Innovation Centre • Clinical Remote Monitoring Hub • Build4Karnataka", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#16B8A6"), spaceAfter=10))

    # Patient Demographic Table
    demo_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {u.full_name}", body_style),
            Paragraph(f"<b>Age / Gender:</b> {pat.age or 'N/A'} yrs / {pat.gender or 'N/A'}", body_style),
            Paragraph(f"<b>Current Risk:</b> <font color='#16A36A'><b>{pat.current_risk_level} ({pat.current_risk_score}/100)</b></font>", body_style)
        ],
        [
            Paragraph(f"<b>Conditions:</b> {', '.join(pat.medical_conditions) if pat.medical_conditions else 'None specified'}", body_style),
            Paragraph(f"<b>Wearable Device:</b> {pat.wearable_device_name}", body_style),
            Paragraph(f"<b>Report Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", body_style)
        ]
    ]
    t_demo = Table(demo_data, colWidths=[200, 170, 170])
    t_demo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F7F8F4")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#D8F1E9")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_demo)
    story.append(Spacer(1, 10))

    # 14-Day Baseline Summary
    story.append(Paragraph("1. Personalized 14-Day Baseline Models", heading_style))
    base_rows = [["Metric", "Learned Mean", "Std Dev", "Normal 10th-90th Pct Range", "Status"]]
    for b in baselines:
        base_rows.append([
            b.metric.replace("_", " ").title(),
            f"{b.mean}",
            f"±{b.std_dev}",
            f"{b.p10} – {b.p90}",
            "Learned & Stable"
        ])
    t_base = Table(base_rows, colWidths=[140, 100, 100, 120, 80])
    t_base.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#102D35")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8E5")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_base)
    story.append(Spacer(1, 10))

    # Recent Telemetry Vitals
    story.append(Paragraph("2. Recent Wearable Vitals Telemetry (Last 5 Readings)", heading_style))
    vital_rows = [["Timestamp (UTC)", "Heart Rate", "Resting HR", "SpO2 (%)", "HRV (ms)", "Resp Rate", "Source"]]
    for v in vitals[:5]:
        vital_rows.append([
            v.timestamp.strftime("%Y-%m-%d %H:%M"),
            f"{v.heart_rate} BPM",
            f"{v.resting_heart_rate} BPM",
            f"{v.spo2}%",
            f"{v.hrv} ms",
            f"{v.respiratory_rate} rpm",
            "Simulated (Demo)" if v.is_simulated else "Live Sensor"
        ])
    t_vit = Table(vital_rows, colWidths=[110, 75, 75, 60, 65, 65, 90])
    t_vit.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#164B49")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8E5")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_vit)
    story.append(Spacer(1, 10))

    # Explainable Alerts
    story.append(Paragraph("3. Clinical Early Warning Alerts Timeline", heading_style))
    if alerts:
        alert_rows = [["Time", "Severity", "Triggering Alert & Physiological Explanation", "Suggested Action"]]
        for a in alerts:
            alert_rows.append([
                a.timestamp.strftime("%m-%d %H:%M"),
                a.severity,
                Paragraph(f"<b>{a.title}</b><br/>{a.explanation}", body_style),
                Paragraph(a.suggested_action, body_style)
            ])
        t_al = Table(alert_rows, colWidths=[65, 55, 250, 170])
        t_al.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#087F70")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8E5")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_al)
    else:
        story.append(Paragraph("No active or recent clinical alerts logged.", body_style))
    story.append(Spacer(1, 14))

    # Mandatory Regulatory & Medical Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#E2E8E5"), spaceAfter=6))
    story.append(Paragraph(
        "<b>DATA SOURCE & CLINICAL DISCLAIMER:</b> The vital telemetry records above contain simulated demonstration data and continuous wearable sensory feeds. "
        "PULSEORA is an early warning and health intelligence monitoring platform designed for pattern detection and early notification. "
        "It is NOT a certified or validated diagnostic medical device. Never rely on automated risk scores in isolation for acute diagnostic decisions.",
        disclaimer_style
    ))

    doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
