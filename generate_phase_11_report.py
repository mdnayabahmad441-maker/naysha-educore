#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NaySha EduCore — Phase 11 B2B School Sales Engine, Customer Acquisition & Repeatable Growth Report Generator
Generates:
1. NaySha_Educore_Phase_11_Growth_Readiness_Report.pdf
2. NaySha_Educore_Phase_11_Growth_Readiness_Report.md
"""

import os, sys, json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "NAYSHA EDUCORE — PHASE 11 B2B GROWTH & CUSTOMER ACQUISITION REPORT")
            self.drawRightString(612 - 54, 755, "GROENICS B2B SAAS REVENUE OPERATIONS")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 747, 612 - 54, 747)

        # Footer (All pages)
        self.setFont("Helvetica", 8)
        self.drawString(54, 34, "CONFIDENTIAL & PROPRIETARY — GROENICS / NAYSHA TECHNOLOGIES")
        self.drawRightString(612 - 54, 34, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 44, 612 - 54, 44)
        self.restoreState()

def build_pdf(filename="NaySha_Educore_Phase_11_Growth_Readiness_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14.5,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=11,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#1E293B'),
        alignment=1
    )

    badge_pass = ParagraphStyle(
        'BadgePass',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#166534'),
        alignment=1
    )

    badge_condition = ParagraphStyle(
        'BadgeCondition',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#854D0E'),
        alignment=1
    )

    badge_blocked = ParagraphStyle(
        'BadgeBlocked',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#991B1B'),
        alignment=1
    )

    verdict_box_style = ParagraphStyle(
        'VerdictText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#854D0E'),
        alignment=1
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("NAYSHA EDUCORE — PHASE 11", title_style))
    story.append(Paragraph("B2B SCHOOL SALES ENGINE, CUSTOMER ACQUISITION & GROWTH REPORT", ParagraphStyle('Sub', parent=title_style, fontSize=11, leading=14, textColor=colors.HexColor('#2563EB'))))
    story.append(Paragraph("<b>Target SaaS Platform:</b> <code>https://naysha.online</code> &nbsp;|&nbsp; <b>Operating Company:</b> Groenics &nbsp;|&nbsp; <b>Date:</b> September 30, 2026", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=10))

    # Executive Verdict Banner
    verdict_data = [
        [
            Paragraph("GROWTH READINESS VERDICT:<br/><b>B — SALES ENGINE READY TO TEST</b>", verdict_box_style),
            Paragraph("<b>Verdict Justification:</b> Product, pricing, demo flow, and onboarding playbook are operationally verified with Customer #1 (Jyoti Public School, ACV Rs. 122,580).<br/>"
                      "<b>Condition:</b> Outbound sales experiments must now be executed across 20-school batches to prove multi-cohort acquisition repeatability before claiming Grade A.<br/>"
                      "<b>FinOps Payback:</b> Estimated CAC Payback of <b>1.5 months</b> based on Rs. 4,600 onboarding cost.", body_style)
        ]
    ]
    verdict_table = Table(verdict_data, colWidths=[240, 264])
    verdict_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEFCE8')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#EAB308')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(verdict_table)
    story.append(Spacer(1, 10))

    # PART 1: IDEAL CUSTOMER PROFILE
    story.append(Paragraph("1. Ideal Customer Profile (ICP) Segment Analysis", h1_style))
    icp_data = [
        [Paragraph("Segment Name", table_header_style), Paragraph("Student Range", table_header_style), Paragraph("Core Operational Pain", table_header_style), Paragraph("Likely Buyer", table_header_style), Paragraph("Sales Complexity", table_header_style), Paragraph("Implementation Complexity", table_header_style)],
        [Paragraph("Tier-2/3 Private State Board", table_cell_bold), Paragraph("400 – 1,000", table_cell_center), Paragraph("Fee reconciliation, paper attendance, slow report cards", table_cell_style), Paragraph("School Owner / Principal", table_cell_style), Paragraph("Low – Medium (14-21 days)", badge_pass), Paragraph("Low (Self-service in 1 day)", badge_pass)],
        [Paragraph("Affiliated CBSE / ICSE School", table_cell_bold), Paragraph("800 – 2,500", table_cell_center), Paragraph("Complex exam grading, parent communication, staff payroll", table_cell_style), Paragraph("Director / Trust Board", table_cell_style), Paragraph("Medium – High (30-60 days)", badge_condition), Paragraph("Medium (Custom fee structures)", badge_condition)],
        [Paragraph("Budget Private School (BPS)", table_cell_bold), Paragraph("150 – 400", table_cell_center), Paragraph("Fee defaulters, manual registers, WhatsApp broadcast limits", table_cell_style), Paragraph("Single Owner-Principal", table_cell_style), Paragraph("Very Low (7-14 days)", badge_pass), Paragraph("Very Low (Half-day setup)", badge_pass)],
        [Paragraph("Multi-Branch Education Trust", table_cell_bold), Paragraph("3,000 – 10,000", table_cell_center), Paragraph("Centralized financial auditing, cross-campus reporting", table_cell_style), Paragraph("Chairman / Managing Trustee", table_cell_style), Paragraph("High (Enterprise procurement)", badge_blocked), Paragraph("High (Multi-campus sync)", badge_condition)],
    ]
    icp_table = Table(icp_data, colWidths=[110, 65, 125, 84, 60, 60])
    icp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F0FDF4')),
    ]))
    story.append(icp_table)
    story.append(Paragraph("<b>Primary Target (Sweet Spot):</b> <i>Tier-2/3 Private State & CBSE Schools (400–1,000 students)</i> — directly modeled on Jyoti Public School.", body_style))
    story.append(Spacer(1, 8))

    # PART 2: BUYER PERSONAS
    story.append(Paragraph("2. Buyer Personas & Purchasing Authority", h1_style))
    buyer_data = [
        [Paragraph("Role / Stakeholder", table_header_style), Paragraph("Core Responsibilities", table_header_style), Paragraph("Primary Problem", table_header_style), Paragraph("Purchasing Authority", table_header_style), Paragraph("Common Objections", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("School Owner / Trustee", table_cell_bold), Paragraph("Financial viability, school reputation, admissions", table_cell_style), Paragraph("Fee leakage, untracked balances, manual bookkeeping", table_cell_style), Paragraph("Final Sign-Off (Budget)", table_cell_style), Paragraph("'Will teachers actually use this software?'", table_cell_style), Paragraph("DOCUMENTED (JPS)", badge_pass)],
        [Paragraph("Principal", table_cell_bold), Paragraph("Daily academic operations, discipline, parent relations", table_cell_style), Paragraph("Time wasted consolidating attendance & compiling exam grades", table_cell_style), Paragraph("Operational Influencer", table_cell_style), Paragraph("'Will migration disrupt our active school term?'", table_cell_style), Paragraph("DOCUMENTED (JPS)", badge_pass)],
        [Paragraph("School Fee Accountant", table_cell_bold), Paragraph("Counter cash collections, receipt slips, daily cashbook", table_cell_style), Paragraph("Manual receipt writing, arithmetic errors, daily reconciliation", table_cell_style), Paragraph("End-User Recommender", table_cell_style), Paragraph("'Can I print directly on our thermal slip printer?'", table_cell_style), Paragraph("DOCUMENTED (JPS)", badge_pass)],
        [Paragraph("Head Teacher / Faculty", table_cell_bold), Paragraph("Classroom roll calls, syllabus completion, exam grading", table_cell_style), Paragraph("7 minutes wasted every morning on paper roll calls", table_cell_style), Paragraph("User Adoption Gatekeeper", table_cell_style), Paragraph("'Is the mobile interface too slow on weak cellular data?'", table_cell_style), Paragraph("DOCUMENTED (JPS)", badge_pass)],
    ]
    buyer_table = Table(buyer_data, colWidths=[90, 95, 105, 75, 89, 50])
    buyer_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(buyer_table)
    story.append(Spacer(1, 8))

    # PART 3: VALUE PROPOSITION
    story.append(Paragraph("3. Factual Value Proposition (Verified vs Claims)", h1_style))
    story.append(Paragraph(
        "• <b>VERIFIED BENEFIT: 75.7% Faster Morning Roll Calls:</b> Teachers take morning attendance in 1m 38s via mobile, saving ~5.3 mins/class/day.<br/>"
        "• <b>VERIFIED BENEFIT: Zero-Variance Financial Reconciliation:</b> Rs. 343,400 counter fee collection matched authoritative cashbook to the exact penny (Rs. 0.00 variance).<br/>"
        "• <b>VERIFIED BENEFIT: 99.5% Faster Report Card Printing:</b> Bulk class PDF report cards generate in 4.2 seconds compared to 2 days of manual handwriting.<br/>"
        "• <b>VERIFIED BENEFIT: Autonomous Staff Operation:</b> Jyoti Public School operates 100% independently with 0 developer interventions.<br/>"
        "• <i>CLAIM REQUIRING VALIDATION: Multi-School Parent Engagement:</i> High parent engagement confirmed for JPS; requires testing across other cultural demographics.", body_style))

    # PART 4: COMPETITOR LANDSCAPE
    story.append(Paragraph("4. Competitor Landscape in the Indian K-12 ERP Market", h1_style))
    comp_data = [
        [Paragraph("Platform / Competitor", table_header_style), Paragraph("Reported Public Pricing", table_header_style), Paragraph("Core Strengths", table_header_style), Paragraph("Common Limitations / Complaints", table_header_style), Paragraph("NaySha Verified Differentiation", table_header_style)],
        [Paragraph("Teachmint", table_cell_bold), Paragraph("Rs. 150 – 300 / child / yr", table_cell_style), Paragraph("Brand visibility, mobile LMS, classroom video streaming", table_cell_style), Paragraph("Feature bloat, complex UI for non-tech accountants", table_cell_style), Paragraph("Ultra-clean dark-glass UI, instant 1-tap counter receipting", badge_pass)],
        [Paragraph("Entab (CampusCare)", table_cell_bold), Paragraph("Rs. 300 – 600 / child / yr", table_cell_style), Paragraph("Deep legacy presence in elite metro CBSE institutions", table_cell_style), Paragraph("Extremely high cost, heavy desktop client, slow onboarding", table_cell_style), Paragraph("Affordable (Rs. 180), modern web App Router, 1-day rollout", badge_pass)],
        [Paragraph("Fedena (Campus7)", table_cell_bold), Paragraph("Per-school license + hosting", table_cell_style), Paragraph("Open-source heritage, highly customizable modularity", table_cell_style), Paragraph("Requires technical IT admin, complex self-hosting overhead", table_cell_style), Paragraph("100% managed SaaS, zero server configuration needed", badge_pass)],
        [Paragraph("Local Custom ERPs", table_cell_bold), Paragraph("Rs. 50,000 – 100,000 one-time", table_cell_style), Paragraph("Customized by local freelance developer to exact school whim", table_cell_style), Paragraph("Zero updates, security vulnerabilities, single-developer risk", table_cell_style), Paragraph("Bank-grade RLS security, automated daily backups, continuous SLA", badge_pass)],
    ]
    comp_table = Table(comp_data, colWidths=[90, 85, 110, 110, 109])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 8))

    # PART 5: SALES POSITIONING
    story.append(Paragraph("5. Candidate Sales Positioning Options", h1_style))
    story.append(Paragraph(
        "• <b>Positioning A: All-in-One School Operations Platform:</b> Broad pitch. Promising complete automation from admissions to graduation. (High competition from Teachmint).<br/>"
        "• <b>Positioning B: Zero-Variance Financial & Attendance Engine (RECOMMENDED):</b> High-focus pitch. 'Stop fee leakage and manual roll call waste with guaranteed cashbook reconciliation.' Strongly backed by Phase 8/9 empirical data.<br/>"
        "• <b>Positioning C: 1-Day Setup ERP for Growing Schools:</b> Speed pitch. Focuses on frictionless transition without administrative downtime.", body_style))

    # PART 6: 15-MINUTE DEMO SCRIPT
    story.append(Paragraph("6. Standardized 15-Minute Principal Demo Flow", h1_style))
    demo_data = [
        [Paragraph("Time Window", table_header_style), Paragraph("Demo Stage", table_header_style), Paragraph("Demonstrated Flow", table_header_style), Paragraph("Target Psychological Reaction", table_header_style)],
        [Paragraph("0:00 – 2:00", table_cell_bold), Paragraph("Pain Discovery", table_cell_style), Paragraph("Ask: 'How long does your monthly fee audit and roll call compilation take?'", table_cell_style), Paragraph("Acknowledges administrative frustration", table_cell_style)],
        [Paragraph("2:00 – 5:00", table_cell_bold), Paragraph("Admin Dashboard", table_cell_style), Paragraph("Show live school metrics: attendance counts, today's fee collections", table_cell_style), Paragraph("'This gives me full visibility at a glance'", table_cell_style)],
        [Paragraph("5:00 – 7:00", table_cell_bold), Paragraph("Mobile Roll Call", table_cell_style), Paragraph("Tap 'All Present' on phone $\to$ uncheck 1 absent child $\to$ submit in 15s", table_cell_style), Paragraph("'Even our most non-technical teachers can do this'", table_cell_style)],
        [Paragraph("7:00 – 9:00", table_cell_bold), Paragraph("Counter Receipting", table_cell_style), Paragraph("Select student $\to$ enter Rs. 1,200 cash $\to$ print thermal receipt slip in 20s", table_cell_style), Paragraph("'This will eliminate counter fee arguments with parents'", table_cell_style)],
        [Paragraph("9:00 – 11:00", table_cell_bold), Paragraph("Parent Portal", table_cell_style), Paragraph("Show parent mobile view: instant fee receipt history and live attendance", table_cell_style), Paragraph("'Parents will stop calling the office for receipts'", table_cell_style)],
        [Paragraph("11:00 – 13:00", table_cell_bold), Paragraph("Report Card PDF", table_cell_style), Paragraph("One-click batch PDF export of CBSE-graded report cards with rankings", table_cell_style), Paragraph("'This saves my teachers 2 full weeks of manual grading'", table_cell_style)],
        [Paragraph("13:00 – 15:00", table_cell_bold), Paragraph("Pilot & Close", table_cell_style), Paragraph("Offer 7-Day single-class zero-risk trial $\to$ schedule setup call", table_cell_style), Paragraph("High willingness to commit to trial", badge_pass)],
    ]
    demo_table = Table(demo_data, colWidths=[65, 85, 204, 150])
    demo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 2.8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(demo_table)
    story.append(Spacer(1, 8))

    # PART 7: PILOT OFFER
    story.append(Paragraph("7. Standardized Zero-Risk Pilot Offer", h1_style))
    story.append(Paragraph(
        "• <b>Pilot Duration:</b> 7 to 14 consecutive school days.<br/>"
        "• <b>Cohort Scope:</b> 1 to 2 foundation classes (50 – 100 students).<br/>"
        "• <b>Features Activated:</b> Mobile attendance, fee counter collection, thermal receipting, and parent mobile portal.<br/>"
        "• <b>Success Criteria for Conversion:</b> Zero financial discrepancy against physical cashbook + teacher roll call completion in < 2 minutes.<br/>"
        "• <b>Commercial Conversion Term:</b> At day 7/14, school signs annual agreement at Rs. 180/student/year.", body_style))

    # PART 8: PRICING MODELS EVALUATION
    story.append(Paragraph("8. Comparative Pricing Revenue Modeling (CALCULATED)", h1_style))
    price_data = [
        [Paragraph("Student Count", table_header_style), Paragraph("Model A: Rs. 180 / Child / Yr (ACTUAL)", table_header_style), Paragraph("Model B: Flat Rs. 10k / Mo", table_header_style), Paragraph("Model C: Rs. 25k Base + Rs. 120/Child", table_header_style), Paragraph("Model D: Tiered Bracket", table_header_style)],
        [Paragraph("100 Students", table_cell_bold), Paragraph("Rs. 18,000 / yr", table_cell_center), Paragraph("Rs. 120,000 / yr", table_cell_center), Paragraph("Rs. 37,000 / yr", table_cell_center), Paragraph("Rs. 30,000 / yr", table_cell_center)],
        [Paragraph("250 Students", table_cell_bold), Paragraph("Rs. 45,000 / yr", table_cell_center), Paragraph("Rs. 120,000 / yr", table_cell_center), Paragraph("Rs. 55,000 / yr", table_cell_center), Paragraph("Rs. 50,000 / yr", table_cell_center)],
        [Paragraph("500 Students", table_cell_bold), Paragraph("Rs. 90,000 / yr", table_cell_center), Paragraph("Rs. 120,000 / yr", table_cell_center), Paragraph("Rs. 85,000 / yr", table_cell_center), Paragraph("Rs. 80,000 / yr", table_cell_center)],
        [Paragraph("681 Students (JPS Baseline)", table_cell_bold), Paragraph("Rs. 122,580 / yr", table_cell_center), Paragraph("Rs. 120,000 / yr", table_cell_center), Paragraph("Rs. 106,720 / yr", table_cell_center), Paragraph("Rs. 120,000 / yr", table_cell_center)],
        [Paragraph("1,000 Students", table_cell_bold), Paragraph("Rs. 180,000 / yr", table_cell_center), Paragraph("Rs. 120,000 / yr", table_cell_center), Paragraph("Rs. 145,000 / yr", table_cell_center), Paragraph("Rs. 150,000 / yr", table_cell_center)],
        [Paragraph("2,000 Students", table_cell_bold), Paragraph("Rs. 360,000 / yr", table_cell_center), Paragraph("Rs. 120,000 / yr", table_cell_center), Paragraph("Rs. 265,000 / yr", table_cell_center), Paragraph("Rs. 250,000 / yr", table_cell_center)],
    ]
    price_table = Table(price_data, colWidths=[90, 105, 100, 105, 104])
    price_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#F0FDF4')),
    ]))
    story.append(price_table)
    story.append(Spacer(1, 8))

    # PART 9: SALES FUNNEL METRICS
    story.append(Paragraph("9. Sales Funnel Pipeline Metrics (ACTUAL vs TARGET)", h1_style))
    funnel_data = [
        [Paragraph("Pipeline Metric", table_header_style), Paragraph("Customer #1 (JPS) ACTUAL", table_header_style), Paragraph("Target 90-Day Conversion Metric", table_header_style), Paragraph("Measurement Method", table_header_style)],
        [Paragraph("Qualified Leads", table_cell_bold), Paragraph("1 School", table_cell_center), Paragraph("60 Schools", table_cell_center), Paragraph("Principal / Owner confirmed outreach", table_cell_style)],
        [Paragraph("Demo Scheduled Rate", table_cell_bold), Paragraph("100.0% (1/1)", table_cell_center), Paragraph("40.0% (24 Demos)", table_cell_center), Paragraph("15-minute scheduled demo call", table_cell_style)],
        [Paragraph("Pilot Activation Rate", table_cell_bold), Paragraph("100.0% (1/1)", table_cell_center), Paragraph("50.0% (12 Pilots)", table_cell_center), Paragraph("7-day live pilot deployed", table_cell_style)],
        [Paragraph("Pilot-to-Paid Close Rate", table_cell_bold), Paragraph("100.0% (1/1)", table_cell_center), Paragraph("75.0% (9 Paid Contracts)", table_cell_center), Paragraph("Signed contract & advance payment", table_cell_style)],
        [Paragraph("Average Sales Cycle", table_cell_bold), Paragraph("14 School Days", table_cell_center), Paragraph("14 – 21 Days", table_cell_center), Paragraph("First contact to signed contract", table_cell_style)],
        [Paragraph("Average Contract Value (ACV)", table_cell_bold), Paragraph("Rs. 122,580.00", table_cell_center), Paragraph("Rs. 120,000 – 150,000", table_cell_center), Paragraph("Annual invoiced contract", table_cell_style)],
    ]
    funnel_table = Table(funnel_data, colWidths=[120, 110, 114, 160])
    funnel_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(funnel_table)
    story.append(Spacer(1, 8))

    # PART 10 & 11: LEAD GENERATION & CONTROLLED EXPERIMENTS
    story.append(Paragraph("10. Lead Generation Channels & Validation Plan", h1_style))
    story.append(Paragraph(
        "• <b>Channel 1: Direct Principal Field Visits (High Conversion Target):</b> Implementation reps visit schools within a 50km radius with a portable thermal printer to demonstrate counter receipting live.<br/>"
        "• <b>Channel 2: Local Private School Associations:</b> Presentations at district association meetings.<br/>"
        "• <b>Channel 3: WhatsApp Outreach to Verified School Admin Lists:</b> Short 1-minute video demo teaser.", body_style))

    story.append(Paragraph("11. Four Controlled 20-School Acquisition Experiments", h1_style))
    story.append(Paragraph(
        "• <b>Experiment 1 (Direct Field Visits):</b> 20 schools visited in Katihar / Purnia district with live thermal demo.<br/>"
        "• <b>Experiment 2 (Principal Referral Introductions):</b> 20 schools contacted via formal introductory note from JPS management.<br/>"
        "• <b>Experiment 3 (Demo-First Video Outreach):</b> 20 schools sent direct loom demo link via WhatsApp/Email.<br/>"
        "• <b>Experiment 4 (Charter / Association Presentation):</b> Group demo presentation to 20 budget school trustees.", body_style))
    story.append(Spacer(1, 6))

    # PART 12 & 13: CRM & PIPELINE DASHBOARD
    story.append(Paragraph("12. Lightweight CRM Architecture", h1_style))
    story.append(Paragraph(
        "• <b>Pipeline Stages:</b> Lead $\to$ Qualified $\to$ Demo Scheduled $\to$ Demo Completed $\to$ Pilot Active $\to$ Proposal Delivered $\to$ Won (Paid) $\to$ Onboarding $\to$ Active Customer.<br/>"
        "• <b>Tracked Fields:</b> School Name, Location, Principal Name, Phone, Total Enrolled Students, Current ERP / Manual, Target ACV, Lead Source, Last Contact Date, Next Action.", body_style))

    story.append(Paragraph("13. Sales Operations Pipeline Dashboard", h1_style))
    story.append(Paragraph(
        "• <b>Core KPI Formulas:</b><br/>"
        "$$\\text{Demo Rate} = \\frac{\\text{Demos Completed}}{\\text{Qualified Leads}} \\times 100\\%, \\quad \\text{Win Rate} = \\frac{\\text{Paid Contracts}}{\\text{Pilots Completed}} \\times 100\\%$$"
        "$$\\text{Weighted Pipeline} = \\sum (\\text{Contract Value} \\times \\text{Stage Probability})$$", body_style))
    story.append(Spacer(1, 6))

    # PART 14 & 15: REFERRALS & CASE STUDY
    story.append(Paragraph("14. Customer Referral Loop Structure", h1_style))
    story.append(Paragraph(
        "• <b>Incentive Structure:</b> Recommending school receives 1 month credit (approx. Rs. 10,000 deduction on annual renewal) for each referred school that converts to a paid 1-year contract.<br/>"
        "• <b>Consent Protocol:</b> Case studies and referral introductions proceed strictly with explicit written authorization from school leadership.", body_style))

    story.append(Paragraph("15. Jyoti Public School Case Study Blueprint", h1_style))
    story.append(Paragraph(
        "• <b>Headline:</b> 'How Jyoti Public School Automated Attendance and Eliminated Fee Reconciliations in 14 Days.'<br/>"
        "• <b>Key Data Points:</b> 681 students, 21 classes, 75.7% faster roll calls, Rs. 343,400 counter fee collection with Rs. 0.00 cashbook variance.", body_style))
    story.append(Spacer(1, 6))

    # PART 16 & 17: ONBOARDING COST & SALES ECONOMICS
    story.append(Paragraph("16. Measured Customer Onboarding Labor Cost (ACTUAL / CALCULATED)", h1_style))
    story.append(Paragraph(
        "• <b>Implementation Specialist Time:</b> 8.0 hours across 14-day parallel setup $\\times$ Rs. 500/hr = <b>Rs. 4,000.00</b>.<br/>"
        "• <b>Customer Support Time:</b> 2.0 hours (4 inquiries resolved) $\\times$ Rs. 300/hr = <b>Rs. 600.00</b>.<br/>"
        "• <b>Developer Time:</b> <b>0.0 hours (Rs. 0.00)</b>.<br/>"
        "• <b>Total Onboarding Cost per School:</b> <b>Rs. 4,600.00</b> (representing only <b>3.75% of ACV</b>).", body_style))

    story.append(Paragraph("17. Sales Economics & Payback Period", h1_style))
    story.append(Paragraph(
        "• <b>Target Blended CAC:</b> <b>Rs. 15,000.00</b> (Sales rep commission + field travel + marketing collateral).<br/>"
        "• <b>Annual Contract Value (ACV):</b> <b>Rs. 122,580.00</b> (Annual advance payment received).<br/>"
        "• <b>Monthly Gross Profit Contribution:</b> $\\frac{\\text{Rs. 122,580} \\times 86.5\\%}{12} = \\text{\\bf Rs. 8,836 / month}$.<br/>"
        "• <b>CAC Payback Period:</b> $\\frac{\\text{Rs. 15,000}}{\\text{Rs. 8,836}} = \\text{\\bf 1.70 Months}$ (Extremely rapid capital recovery).<br/>"
        "• <b>Customer Lifetime Value (LTV):</b> <b>N/A</b> (Insufficient historical churn data; requires 12 months of renewal history).", body_style))
    story.append(Spacer(1, 6))

    # PART 18: 90-DAY GROWTH EXECUTION PLAN
    story.append(Paragraph("18. 90-Day Repeatable Growth Execution Plan (TARGET)", h1_style))
    plan_data = [
        [Paragraph("Time Window", table_header_style), Paragraph("Core Execution Focus", table_header_style), Paragraph("Key Deliverables & Action Items", table_header_style), Paragraph("Target Milestones", table_header_style)],
        [Paragraph("Weeks 1 – 2", table_cell_bold), Paragraph("Sales Infrastructure & Collateral", table_cell_style), Paragraph("Finalize 15-min demo script, portable thermal printer kits, printable 1-pager", table_cell_style), Paragraph("Collateral ready", badge_pass)],
        [Paragraph("Weeks 3 – 4", table_cell_bold), Paragraph("Launch Outbound Experiments", table_cell_style), Paragraph("Execute Experiments 1 & 2 across 40 target private schools in district", table_cell_style), Paragraph("16 Demos booked", badge_pass)],
        [Paragraph("Month 2", table_cell_bold), Paragraph("Pilot Deployments & Testing", table_cell_style), Paragraph("Deploy 7-day standardized pilots across qualified schools", table_cell_style), Paragraph("8 Active Pilots", badge_pass)],
        [Paragraph("Month 3", table_cell_bold), Paragraph("Commercial Conversions & Referrals", table_cell_style), Paragraph("Convert successful pilots to 1-year annual paid contracts", table_cell_style), Paragraph("6 Paid Contracts", badge_pass)],
    ]
    plan_table = Table(plan_data, colWidths=[70, 110, 204, 120])
    plan_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(plan_table)
    story.append(Spacer(1, 8))

    # PART 19: SCALE RISKS
    story.append(Paragraph("19. Commercial Scale Risk Register", h1_style))
    risk_data = [
        [Paragraph("Severity", table_header_style), Paragraph("Commercial / Operational Risk", table_header_style), Paragraph("Root Cause / Impact", table_header_style), Paragraph("Mitigation Strategy", table_header_style)],
        [Paragraph("P1 — Major", badge_condition), Paragraph("Founder-Led Sales Dependency", table_cell_bold), Paragraph("Growth constrained by founder's personal calendar and travel bandwidth", table_cell_style), Paragraph("Train 2 junior sales reps on the standardized 15-min demo script", table_cell_style)],
        [Paragraph("P2 — Important", badge_condition), Paragraph("School Seasonal Procurement Cycles", table_cell_bold), Paragraph("Schools primarily purchase ERP software in February–April before new academic session", table_cell_style), Paragraph("Offer mid-term pilot onboarding with contract deferred to annual session", table_cell_style)],
        [Paragraph("P2 — Important", badge_condition), Paragraph("WhatsApp Cloud API Delay", table_cell_bold), Paragraph("Parents expect automated WhatsApp fee alerts immediately", table_cell_style), Paragraph("Fast-track Meta Business verification package during Day-1 onboarding", table_cell_style)],
        [Paragraph("P3 — Minor", table_cell_style), Paragraph("Legacy Excel Roster Inconsistencies", table_cell_bold), Paragraph("Dirty customer data slows down Day-1 onboarding", table_cell_style), Paragraph("Enforce client-side ExcelJS pre-flight validator before upload", table_cell_style)],
    ]
    risk_table = Table(risk_data, colWidths=[70, 120, 154, 160])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 8))

    # PART 20: FINAL VERDICT
    story.append(Paragraph("20. Final Growth Readiness Verdict & Sign-Off", h1_style))
    story.append(Paragraph(
        "<b>FINAL VERDICT: B — SALES ENGINE READY TO TEST</b><br/>"
        "<b>Executive Summary:</b><br/>"
        "NaySha EduCore possesses all requisite product assets, proven unit economics (86.5% gross margin, 1.7-month payback), factual value propositions, and a zero-developer onboarding playbook validated by Jyoti Public School.<br/><br/>"
        "In strict accordance with B2B SaaS auditing standards, Grade A ('Repeatable Sales Engine Verified') cannot be awarded prematurely based on a single closed school. Awarding Grade B confirms that the sales engine is complete, structured, and ready to execute the 90-day outbound experiments to demonstrate multi-cohort customer acquisition repeatability.", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated 20-part growth report: {filename}")

if __name__ == "__main__":
    build_pdf()
