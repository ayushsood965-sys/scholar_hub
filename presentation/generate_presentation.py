import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# -----------------------------------------------------------------------------
# PALETTE DEFINITION (HPU Brand Identity: Forest Green, Gold, Crisp Slate)
# -----------------------------------------------------------------------------
COLOR_PRIMARY_DARK  = RGBColor(19, 58, 38)     # #133A26 Deep Forest Green
COLOR_PRIMARY_MID   = RGBColor(27, 67, 50)     # #1B4332 Rich Emerald
COLOR_ACCENT_GOLD   = RGBColor(197, 155, 39)   # #C59B27 HPU Academic Gold
COLOR_ACCENT_TEAL   = RGBColor(15, 118, 110)   # #0F766E Mint / Teal
COLOR_BG_LIGHT      = RGBColor(248, 250, 252)  # #F8FAFC Soft Cool Slate
COLOR_CARD_BG       = RGBColor(255, 255, 255)  # White Card
COLOR_TEXT_MAIN     = RGBColor(15, 23, 42)     # #0F172A Slate 900
COLOR_TEXT_MUTED    = RGBColor(71, 85, 105)    # #475569 Slate 600
COLOR_TEXT_LIGHT    = RGBColor(241, 245, 249)  # Slate 100
COLOR_BORDER        = RGBColor(226, 232, 240)  # #E2E8F0 Slate 200
COLOR_TAG_BG        = RGBColor(240, 253, 244)  # Soft green tint
COLOR_TAG_TEXT      = RGBColor(22, 101, 52)    # Dark green text

ASSETS_DIR = r"c:\Codee\scholar_hub\presentation\assets"
OUTPUT_PPTX = r"c:\Codee\scholar_hub\presentation\ScholarHub_HPU_Executive_Presentation.pptx"

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_header(slide, title_text, category_text="SCHOLARHUB HPU — INSTITUTIONAL BRIEFING"):
        # Header background banner
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.9))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        # Category / Breadcrumb
        p0 = tf.paragraphs[0]
        p0.text = category_text.upper()
        p0.font.size = Pt(10)
        p0.font.bold = True
        p0.font.color.rgb = COLOR_ACCENT_GOLD
        p0.font.name = "Segoe UI"
        
        # Slide Main Title
        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.size = Pt(22)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_PRIMARY_DARK
        p1.font.name = "Segoe UI"
        p1.space_before = Pt(3)

        # HPU Logo in header corner
        logo_path = os.path.join(ASSETS_DIR, "hpu_logo.png")
        if os.path.exists(logo_path):
            slide.shapes.add_picture(logo_path, Inches(12.1), Inches(0.35), height=Inches(0.85))

    def add_footer(slide, slide_num, total_slides=25):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(6.95), Inches(11.733), Inches(0.4))
        tf = footer_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"Himachal Pradesh University, Shimla  |  ScholarHub Digital Research & Governance Ecosystem  |  Slide {slide_num} of {total_slides}"
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.font.name = "Segoe UI"

    def set_slide_bg(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_image_card(slide, img_name, left, top, width, height, caption=""):
        img_path = os.path.join(ASSETS_DIR, img_name)
        if not os.path.exists(img_path):
            return None
        
        # Outer Card Border Shape
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1.5)

        # Inner Picture slightly inset
        inset = Inches(0.08)
        cap_h = Inches(0.32) if caption else Inches(0)
        pic = slide.shapes.add_picture(img_path, left + inset, top + inset, width=width - (inset * 2), height=height - (inset * 2) - cap_h)

        if caption:
            cap_box = slide.shapes.add_textbox(left + inset, top + height - cap_h - Inches(0.02), width - (inset * 2), cap_h)
            ctf = cap_box.text_frame
            ctf.margin_top = ctf.margin_bottom = ctf.margin_left = ctf.margin_right = 0
            cp = ctf.paragraphs[0]
            cp.text = f"LIVE INTERFACE: {caption}"
            cp.font.size = Pt(8.5)
            cp.font.bold = True
            cp.font.color.rgb = COLOR_ACCENT_TEAL
            cp.font.name = "Segoe UI"
            cp.alignment = PP_ALIGN.CENTER
        return pic

    # =========================================================================
    # SLIDE 1: HERO TITLE SLIDE (For Vice Chancellor & Top Officials)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide1, COLOR_PRIMARY_DARK)

    # Accent Gold Top Strip
    top_strip = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    top_strip.fill.solid()
    top_strip.fill.fore_color.rgb = COLOR_ACCENT_GOLD
    top_strip.line.fill.background()

    # HPU Logo in center top
    logo_path = os.path.join(ASSETS_DIR, "hpu_logo.png")
    if os.path.exists(logo_path):
        slide1.shapes.add_picture(logo_path, Inches(5.9), Inches(1.1), width=Inches(1.5))

    # Title Text Frame
    tb = slide1.shapes.add_textbox(Inches(1.2), Inches(2.7), Inches(10.9), Inches(3.8))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "SCHOLARHUB HPU"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.font.name = "Segoe UI"
    p.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "Unified Ph.D. Research Lifecycle & Academic Governance Ecosystem"
    p2.font.size = Pt(21)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_ACCENT_GOLD
    p2.font.name = "Segoe UI"
    p2.space_before = Pt(8)
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf.add_paragraph()
    p3.text = "Integrated Research Management (ScholarSync)  •  Biometric Attendance & Leave Engine (ScholarTrack)  •  Academic Research Directory"
    p3.font.size = Pt(13)
    p3.font.color.rgb = COLOR_TEXT_LIGHT
    p3.font.name = "Segoe UI"
    p3.space_before = Pt(14)
    p3.alignment = PP_ALIGN.CENTER

    p4 = tf.add_paragraph()
    p4.text = "Executive Institutional Presentation for the Hon'ble Vice Chancellor, Registrar & University Leadership"
    p4.font.size = Pt(12)
    p4.font.bold = True
    p4.font.color.rgb = RGBColor(167, 243, 208)
    p4.font.name = "Segoe UI"
    p4.space_before = Pt(22)
    p4.alignment = PP_ALIGN.CENTER

    p5 = tf.add_paragraph()
    p5.text = "Himachal Pradesh University, Summer Hill, Shimla (H.P.)"
    p5.font.size = Pt(11)
    p5.font.color.rgb = RGBColor(203, 213, 225)
    p5.font.name = "Segoe UI"
    p5.space_before = Pt(6)
    p5.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 2: THE INSTITUTIONAL NEED & VISION
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide2, COLOR_BG_LIGHT)
    add_header(slide2, "Executive Context: Modernizing Ph.D. Governance at HPU", "Strategic Vision")
    add_footer(slide2, 2)

    # 3 Pillars / Challenges vs Solutions Cards
    card_w = Inches(3.64)
    card_h = Inches(4.8)
    card_y = Inches(1.6)

    cards_data = [
        {
            "num": "01",
            "title": "The Legacy Challenge",
            "subtitle": "Paper-Heavy & Fragmented",
            "points": [
                "Ph.D. lifecycle files moving across physical desks for months.",
                "Lack of unified tracking for RAC reviews, coursework & synopsis.",
                "Disparate paper registers for scholar attendance & leave records.",
                "Difficult manual collation of research metrics during NAAC/NIRF audits."
            ],
            "accent": RGBColor(220, 38, 38)
        },
        {
            "num": "02",
            "title": "The ScholarHub Vision",
            "subtitle": "Zero-Paper Digital Trust",
            "points": [
                "Unified monorepo connecting all departments under one portal.",
                "End-to-end transparent doctoral lifecycle tracking from admission to degree.",
                "Live biometric & digital attendance tied to fellowship disbursements.",
                "Instant, verifiable data extraction for statutory UGC & NAAC inspections."
            ],
            "accent": COLOR_PRIMARY_MID
        },
        {
            "num": "03",
            "title": "Direct Leadership Impact",
            "subtitle": "Control, Speed & Prestige",
            "points": [
                "Real-time institutional oversight on VC and Dean dashboards.",
                "Zero risk of proxy attendance or audit vulnerabilities in stipends.",
                "Elevates HPU's NIRF Perception & NAAC Criterion 3 scoring.",
                "Empowers scholars and supervisors with transparent digital timelines."
            ],
            "accent": COLOR_ACCENT_GOLD
        }
    ]

    for idx, c in enumerate(cards_data):
        cx = Inches(0.8) + idx * Inches(4.0)
        shape = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, card_y, card_w, card_h)
        shape.fill.solid()
        shape.fill.fore_color.rgb = COLOR_CARD_BG
        shape.line.color.rgb = COLOR_BORDER
        shape.line.width = Pt(1.5)

        tf = shape.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.28)

        p = tf.paragraphs[0]
        p.text = c["num"]
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = c["accent"]
        p.font.name = "Segoe UI"

        p1 = tf.add_paragraph()
        p1.text = c["title"]
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_TEXT_MAIN
        p1.font.name = "Segoe UI"
        p1.space_before = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = c["subtitle"]
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.font.name = "Segoe UI"
        p2.space_before = Pt(2)

        for pt in c["points"]:
            p_pt = tf.add_paragraph()
            p_pt.text = f"• {pt}"
            p_pt.font.size = Pt(11)
            p_pt.font.color.rgb = COLOR_TEXT_MAIN
            p_pt.font.name = "Segoe UI"
            p_pt.space_before = Pt(8)

    # =========================================================================
    # SLIDE 3: GATEWAY — UNIFIED SINGLE SIGN-ON & ENTRANCE
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide3, COLOR_BG_LIGHT)
    add_header(slide3, "The Central Gateway: Unified Digital Entrance for HPU", "Portal 1: Gateway")
    add_footer(slide3, 3)

    # Left Column: Explanation
    left_box = slide3.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "WHAT IS THE GATEWAY?"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "The Single Unified Front Door (scholarhubhpu.in)"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    p2 = tf.add_paragraph()
    p2.text = "The gateway serves as the central landing hub connecting all university academic modules. Instead of navigating separate, disjointed departmental systems, every student, faculty member, and external visitor enters through one verified official portal."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT_MAIN
    p2.font.name = "Segoe UI"
    p2.space_before = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = "WHY IT WAS DEVELOPED:"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_ACCENT_GOLD
    p3.font.name = "Segoe UI"
    p3.space_before = Pt(14)

    pts = [
        "Eliminates confusion between different departmental links and credentials.",
        "Provides dynamic role routing: direct entry to Ph.D. Lifecycle (ScholarSync) or Attendance Engine (ScholarTrack).",
        "Hosts the Public Academic Research Directory accessible worldwide.",
        "Reinforces HPU's modern, prestigious digital identity with glassmorphic institutional branding."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(6)

    # Right Column: Screenshot Card
    add_image_card(slide3, "01_gateway_hero.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "HPU Student Services Central Gateway Landing Page")

    # =========================================================================
    # SLIDE 4: ACADEMIC RESEARCH DIRECTORY (PUBLIC DISCOVERY)
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide4, COLOR_BG_LIGHT)
    add_header(slide4, "Academic Research Directory: Showcasing HPU's Intellectual Wealth", "Portal 1: Gateway")
    add_footer(slide4, 4)

    left_box = slide4.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "PUBLIC RESEARCH DISCOVERY & TRANSPARENCY"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "A Window to Global Academic Collaborations"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    p2 = tf.add_paragraph()
    p2.text = "A live, searchable public repository displaying all HPU academic departments, approved research supervisors, enrolled doctoral scholars, and active research thrust areas."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT_MAIN
    p2.font.name = "Segoe UI"
    p2.space_before = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = "KEY UNIVERSITY BENEFITS:"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_ACCENT_GOLD
    p3.font.name = "Segoe UI"
    p3.space_before = Pt(12)

    pts = [
        "Attracts National & Global Funding: Agencies (DST, DBT, CSIR, ICSSR) can instantly discover HPU's domain capabilities.",
        "Boosts NIRF 'Perception' Rating: Public scholarly profiles raise academic visibility across India.",
        "Encourages Interdisciplinary Research: Scholars across faculties easily find co-supervisors and joint project partners.",
        "Who is it for? Prospective doctoral candidates, peer universities, industry R&D partners, and NAAC peer reviewers."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(6)

    add_image_card(slide4, "03_academic_directory.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Public Academic Research Directory & Department Explorer")

    # =========================================================================
    # SLIDE 5: SCHOLARSYNC (RMS) — WHAT IT IS & WHY DEVELOPED
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide5, COLOR_BG_LIGHT)
    add_header(slide5, "ScholarSync: Complete Ph.D. Lifecycle Tracking Engine", "Portal 2: Research Management")
    add_footer(slide5, 5)

    left_box = slide5.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "RESEARCH MANAGEMENT SYSTEM (RMS)"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Transforming Doctoral Administration"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    p2 = tf.add_paragraph()
    p2.text = "ScholarSync (sync.scholarhubhpu.in) is a purpose-built doctoral lifecycle automation platform guiding every candidate from their first day of enrollment to the final Viva-Voce defense and degree award."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT_MAIN
    p2.font.name = "Segoe UI"
    p2.space_before = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = "WHY IT WAS CREATED FOR HPU:"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_ACCENT_GOLD
    p3.font.name = "Segoe UI"
    p3.space_before = Pt(12)

    pts = [
        "Replaces bulky physical files that get stuck during inter-departmental transfers.",
        "Guarantees compliance with UGC (Minimum Standards for Award of Ph.D.) Regulations.",
        "Automates notifications for every milestone: Coursework, Synopsis, DRC, RAC, Viva.",
        "Who is it for? Ph.D. Scholars, Research Guides, DRC/RAC Committee Members, Department HODs, Dean of Studies, and Vice Chancellor."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(6)

    add_image_card(slide5, "05_sync_phd_lifecycle_workflow.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Complete Interactive Ph.D. Lifecycle Workflow Map")

    # =========================================================================
    # SLIDE 6: CRUCIAL BENEFIT: NAAC & NIRF DIGITAL COMPLIANCE
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide6, COLOR_BG_LIGHT)
    add_header(slide6, "Institutional Impact: Automated NAAC & NIRF Data Readiness", "Core University Benefit")
    add_footer(slide6, 6)

    # 4 Quadrants for NAAC Criteria
    quad_w = Inches(5.6)
    quad_h = Inches(2.35)
    
    quads = [
        {
            "x": Inches(0.8), "y": Inches(1.6),
            "tag": "NAAC CRITERION 3.1 & 3.2",
            "title": "Grants, Innovations & Patents Tracking",
            "desc": "Automatically catalogues all sanctioned extramural research grants (DST, ICSSR, UGC), funding amounts, research labs, and intellectual property/patents filed by university faculty."
        },
        {
            "x": Inches(6.8), "y": Inches(1.6),
            "tag": "NAAC CRITERION 3.4.2",
            "title": "Ph.D. Candidates Awarded per Guide",
            "desc": "Maintains an immutable digital ledger of Ph.D. completion turnaround times, registered guides, and degree award dates with zero discrepancy during peer team verifications."
        },
        {
            "x": Inches(0.8), "y": Inches(4.2),
            "tag": "NAAC CRITERION 3.4.5 & 3.4.6",
            "title": "Scopus & UGC CARE Publications",
            "desc": "Digital validation of research papers with DOI, Scopus indexing, and UGC CARE category verification before any scholar is permitted to submit their final thesis."
        },
        {
            "x": Inches(6.8), "y": Inches(4.2),
            "tag": "NIRF & STATUTORY COMPLIANCE",
            "title": "One-Click Institutional Data Export",
            "desc": "Replaces months of frantic paper compilation across 30+ departments. Leadership can generate verified accreditation reports in seconds with complete timestamp audit trails."
        }
    ]

    for q in quads:
        box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, q["x"], q["y"], quad_w, quad_h)
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD_BG
        box.line.color.rgb = COLOR_BORDER
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = q["tag"]
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_GOLD
        p.font.name = "Segoe UI"

        p1 = tf.add_paragraph()
        p1.text = q["title"]
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_PRIMARY_DARK
        p1.font.name = "Segoe UI"
        p1.space_before = Pt(3)

        p2 = tf.add_paragraph()
        p2.text = q["desc"]
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.font.name = "Segoe UI"
        p2.space_before = Pt(5)

    # =========================================================================
    # SLIDE 7: FEATURE 1 — ONBOARDING, COURSEWORK & SUPERVISOR ALLOCATION
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide7, COLOR_BG_LIGHT)
    add_header(slide7, "Stage 1: Verified Onboarding & DRC Supervisor Allocation", "ScholarSync Feature")
    add_footer(slide7, 7)

    left_box = slide7.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "FOUNDATIONAL ADMISSION & ALLOCATION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Automated 9-Digit SH-No. & Guide Allotment"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Unique ScholarHub ID: Dynamically generates a tamper-proof 9-digit 'SH No.' linked across both portals.",
        "Coursework Verification: Scholars upload coursework marks cards; verified sequentially by Supervisor and HOD.",
        "DRC Supervisor Allocation: Departmental Research Committee allocates approved supervisors respecting UGC guide quotas (Prof: 8, Assoc: 6, Asst: 4).",
        "Single-Action Clearance: Eliminates weeks of manual file movement between admission office and departmental boards."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide7, "08_sync_student_overview.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Doctoral Candidate Overview & Registered Ph.D. Profile")

    # =========================================================================
    # SLIDE 8: FEATURE 2 — SYNOPSIS & DRC EVALUATION WORKFLOW
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide8, COLOR_BG_LIGHT)
    add_header(slide8, "Stage 2: Research Synopsis Clearance & Formal DRC Review", "ScholarSync Feature")
    add_footer(slide8, 8)

    left_box = slide8.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "RESEARCH TOPIC VALIDATION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Transparent Synopsis Defense Scheduling"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Digital Synopsis Submission: Candidate uploads complete synopsis document and research methodology.",
        "Supervisor Endorsement: Research guide signs off digitally before forwarding to the HOD.",
        "Formal DRC Meeting Scheduling: HOD records DRC date, time, venue, and panel members with automated calendar email invites to candidate and guide.",
        "DRC Outcome Ledger: Records formal committee verdict (Approved, Provisional Clearance, Revisions Required) with permanent feedback notes."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide8, "05_sync_phd_lifecycle_workflow.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "DRC Scheduling & Milestone Transition Architecture")

    # =========================================================================
    # SLIDE 9: FEATURE 3 — 6-MONTH RAC PROGRESS MONITORING
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide9, COLOR_BG_LIGHT)
    add_header(slide9, "Stage 3: Mandatory 6-Month RAC Progress Monitoring", "ScholarSync Feature")
    add_footer(slide9, 9)

    left_box = slide9.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "CONTINUOUS ACADEMIC MONITORING"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Eliminating Dormant & Inactive Candidacies"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Semestral Progress Uploads: Scholars must upload 6-monthly progress reports documenting literature review, experiments, and chapters.",
        "Research Advisory Committee (RAC) Sign-Off: RAC members record meeting minutes, evaluation remarks, and milestone clearances online.",
        "Early Intervention Warning: Flags stalled research early, allowing university leadership and guides to intervene productively.",
        "Audit-Proof Records: Guarantees full UGC compliance proving continuous active research before thesis submission."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide9, "09_sync_student_milestones_rac.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Scholar Milestone Dashboard & 6-Month RAC Tracking")

    # =========================================================================
    # SLIDE 10: FEATURE 4 — PUBLICATIONS, PATENTS & FUNDING
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide10, COLOR_BG_LIGHT)
    add_header(slide10, "Stage 4: Research Publications, Patents & Extramural Grants", "ScholarSync Feature")
    add_footer(slide10, 10)

    left_box = slide10.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "RESEARCH OUTPUT & INTELLECTUAL ASSETS"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Validated Intellectual Property Bank"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Publication Gatekeeping: Automatically verifies that the scholar has satisfied UGC criteria (mandatory Scopus / UGC CARE publications) prior to thesis drafting.",
        "DOI & OpenAlex Integration: Automated retrieval of publication metadata, citations, and journal impact factor.",
        "Extramural Grants Management: Tracks research funding awards, sanctioned budgets, project PIs, and funding agencies.",
        "Patent Ledger: Centralized repository of intellectual property filed or granted under HPU."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide10, "06_sync_funding_grants.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "University Research Grants & Extramural Funding Ledger")

    # =========================================================================
    # SLIDE 11: FEATURE 5 — PRE-SUBMISSION & PLAGIARISM CLEARANCE
    # =========================================================================
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide11, COLOR_BG_LIGHT)
    add_header(slide11, "Stage 5: Pre-Submission Colloquium & Plagiarism Verification", "ScholarSync Feature")
    add_footer(slide11, 11)

    left_box = slide11.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "ACADEMIC INTEGRITY ASSURANCE"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Strict Pre-Submission Seminar Protocol"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Rough Draft & Plagiarism Upload: Candidate submits draft dissertation and official Turnitin/Urkund plagiarism clearance report (<10% similarity).",
        "Pre-Submission Seminar Scheduling: HOD schedules departmental presentation open to faculty and scholars.",
        "Seminar Evaluation Clearance: Committee records 'Cleared' or 'Uncleared with Revisions'.",
        "Binding Thesis Unlock: The portal locks out final bound thesis submission until seminar clearance is officially recorded."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide11, "07_sync_publications_repository.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Scholarly Publications & Dissertation Repository")

    # =========================================================================
    # SLIDE 12: FEATURE 6 — FINAL THESIS, EVALUATION & VIVA-VOCE
    # =========================================================================
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide12, COLOR_BG_LIGHT)
    add_header(slide12, "Stage 6: External Dispatch, Viva-Voce & Degree Award", "ScholarSync Feature")
    add_footer(slide12, 12)

    left_box = slide12.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "FINAL DOCTORAL CONVOCATION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Full Accountability to Degree Conferment"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Supervisor & HOD Final Sign-off: Final bound thesis receives digital signature approvals.",
        "External Examiner Dispatch Tracking: Eliminates 'lost in transit' delays with dispatch method and tracking number logs.",
        "Evaluation Report Recording: Positive examiner reports trigger oral Viva-Voce defense scheduling.",
        "Official Degree Conferment: Following successful defense, the degree award status is updated, generating an immutable doctoral archive record."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide12, "11_sync_faculty_supervisor_dashboard.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Supervisor Sign-Off & Candidate Evaluation Console")

    # =========================================================================
    # SLIDE 13: ROLE-BASED DASHBOARDS (HOD & FACULTY SUPERVISOR)
    # =========================================================================
    slide13 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide13, COLOR_BG_LIGHT)
    add_header(slide13, "Role-Based Leadership: Scholar, Supervisor & HOD Dashboards", "ScholarSync Dashboards")
    add_footer(slide13, 13)

    # 2 side-by-side screenshots with comparative descriptions
    w_half = Inches(5.7)
    h_half = Inches(4.8)

    add_image_card(slide13, "11_sync_faculty_supervisor_dashboard.png", Inches(0.8), Inches(1.6), w_half, h_half, "Supervisor Dashboard: Active Scholars, Pending RAC Reviews & Coursework Approvals")
    add_image_card(slide13, "12_sync_hod_admin_dashboard.png", Inches(6.8), Inches(1.6), w_half, h_half, "HOD / Dean Dashboard: Department Allocation, DRC Meetings & Degree Awarding")

    # =========================================================================
    # SLIDE 14: SCHOLARTRACK (AMS) — WHAT IT IS & WHY DEVELOPED
    # =========================================================================
    slide14 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide14, COLOR_BG_LIGHT)
    add_header(slide14, "ScholarTrack: Integrated Attendance & Leave Engine", "Portal 3: Attendance Management")
    add_footer(slide14, 14)

    left_box = slide14.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "ATTENDANCE MANAGEMENT SYSTEM (AMS)"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Rigorous Academic Presence Monitoring"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    p2 = tf.add_paragraph()
    p2.text = "ScholarTrack (track.scholarhubhpu.in) is an institutional-grade attendance and leave management platform connecting scholars, faculty, department chairs, and the university finance office."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT_MAIN
    p2.font.name = "Segoe UI"
    p2.space_before = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = "WHY IT WAS DEVELOPED:"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_ACCENT_GOLD
    p3.font.name = "Segoe UI"
    p3.space_before = Pt(12)

    pts = [
        "Enforces the mandatory UGC 75% attendance rule for semester exams and course credits.",
        "Eliminates paper attendance registers prone to tampering, proxy attendance, and wear-and-tear.",
        "Guarantees that research scholars maintain verified daily presence before monthly stipends are released.",
        "Who is it for? Ph.D. Scholars, Postgraduate Students, Faculty Instructors, Department HODs, and Finance/Accounts branch."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(6)

    add_image_card(slide14, "13_track_student_overview.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "ScholarTrack Student & Scholar Attendance Overview Console")

    # =========================================================================
    # SLIDE 15: CRUCIAL BENEFIT: FISCAL INTEGRITY & FELLOWSHIP COMPLIANCE
    # =========================================================================
    slide15 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide15, COLOR_BG_LIGHT)
    add_header(slide15, "University Benefit: Fiscal Integrity & Fellowship Stipend Compliance", "Core University Benefit")
    add_footer(slide15, 15)

    # 3 Large Benefit Pillars
    pw = Inches(3.64)
    ph = Inches(4.8)
    py = Inches(1.6)

    pillars = [
        {
            "tag": "STATUTORY AUDIT PROTECTION",
            "title": "CAG & State Audit Compliance",
            "desc": "Government audit teams strictly demand verified proof of physical attendance before admitting fellowship expenditures. ScholarTrack creates an immutable, timestamped digital attendance trail for every disbursed rupee."
        },
        {
            "tag": "ZERO GHOST SCHOLARS",
            "title": "JRF / SRF / NFSC Fellowship Verification",
            "desc": "Prevents unauthorized stipend disbursements to candidates absent without approved leave. Finance office receives certified attendance extracts directly from HOD dashboards with zero manual tampering."
        },
        {
            "tag": "INSTITUTIONAL PEACE OF MIND",
            "title": "Eliminates Dispute & Friction",
            "desc": "Transparent leave balance ledgers and automated percentage metrics prevent end-of-semester arguments regarding detention, hall tickets, and fellowship deductions."
        }
    ]

    for idx, p_item in enumerate(pillars):
        px = Inches(0.8) + idx * Inches(4.0)
        box = slide15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px, py, pw, ph)
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD_BG
        box.line.color.rgb = COLOR_BORDER
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.28)

        p = tf.paragraphs[0]
        p.text = p_item["tag"]
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_GOLD
        p.font.name = "Segoe UI"

        p1 = tf.add_paragraph()
        p1.text = p_item["title"]
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_PRIMARY_DARK
        p1.font.name = "Segoe UI"
        p1.space_before = Pt(6)

        p2 = tf.add_paragraph()
        p2.text = p_item["desc"]
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.font.name = "Segoe UI"
        p2.space_before = Pt(12)

    # =========================================================================
    # SLIDE 16: FEATURE 1 — DAILY ATTENDANCE & REAL-TIME PERCENTAGES
    # =========================================================================
    slide16 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide16, COLOR_BG_LIGHT)
    add_header(slide16, "Feature 1: Daily Attendance Logs & Real-Time Percentage Tracking", "ScholarTrack Feature")
    add_footer(slide16, 16)

    left_box = slide16.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "ATTENDANCE VISIBILITY AT A GLANCE"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Live Attendance Meter & Detailed Daily Ledger"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Live Percentage Gauge: Visual circular progress rings alert scholars immediately if their attendance approaches the 75% critical cutoff.",
        "Daily & Subject-Wise Records: Detailed historical ledger with status (Present, Absent, Duty Leave, Approved Leave) and session timestamps.",
        "Zero End-of-Term Shocks: Students and research scholars know their attendance status on any given day without having to request manual records from departmental clerks."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide16, "14_track_student_attendance_logs.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Real-Time Student Attendance Ledger & Monthly Analysis")

    # =========================================================================
    # SLIDE 17: FEATURE 2 — MULTI-TIER LEAVE MANAGEMENT
    # =========================================================================
    slide17 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide17, COLOR_BG_LIGHT)
    add_header(slide17, "Feature 2: Multi-Tier Paperless Leave Management", "ScholarTrack Feature")
    add_footer(slide17, 17)

    left_box = slide17.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "DIGITAL WORKFLOW WITH AUDIT TRAIL"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Transparent Leave Balances & Fast Approvals"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Multiple Leave Categories: Configurable for Casual Leave, Duty Leave (conferences, field surveys), and Medical Leave.",
        "Supporting Document Upload: Medical certificates or conference invitations are uploaded directly and archived digitally.",
        "Two-Tier Approval Chain: Candidate submits -> Supervisor/Faculty recommends -> Department HOD provides final approval.",
        "Automatic Balance Deduction: Approved leaves adjust student attendance and balance counters in real-time."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide17, "15_track_student_leave_management.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Paperless Student Leave Application & Quota Balance Ledger")

    # =========================================================================
    # SLIDE 18: FEATURE 3 — DEFAULTER DETECTION & EXAM HOLD ENGINE
    # =========================================================================
    slide18 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide18, COLOR_BG_LIGHT)
    add_header(slide18, "Feature 3: Defaulter Risk Engine & Automated Detention Alerts", "ScholarTrack Feature")
    add_footer(slide18, 18)

    left_box = slide18.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "ACADEMIC STANDARDS ENFORCEMENT"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Instant Identification of At-Risk Students (<75%)"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Automated Defaulter Computation: Algorithm scans attendance across all departments and categorizes students <75% and critical <65%.",
        "Executive HOD & Dean Drill-Down: Leadership can view student-wise attendance logs, missed classes, and medical exemptions.",
        "Legally Defensible Examination Holds: Eliminates subjective favoritism or last-minute disputes over admit card issuance.",
        "Automated Warning Emails: Students receive proactive alerts weeks before exams to recover their required attendance."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide18, "17_track_hod_approvals_defaulters.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Department Defaulter Analytics & Multi-Level Approvals Tab")

    # =========================================================================
    # SLIDE 19: CLUBBED FEATURES: CORRECTIONS, MAPPING & MASTER POLICIES
    # =========================================================================
    slide19 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide19, COLOR_BG_LIGHT)
    add_header(slide19, "Operational Controls: Attendance Corrections & Policy Engine", "ScholarTrack Masters")
    add_footer(slide19, 19)

    left_box = slide19.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "FLEXIBLE INSTITUTIONAL ADMINISTRATION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Complete Departmental Flexibility"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Attendance Correction Workflow: If a student misses punching due to official duty, they can request correction with reason and document; approved by course teacher and HOD.",
        "Subject-Semester Mapping: Easily map enrolled students to faculty members, course codes, and timetables.",
        "Master Holiday & Session Rules: Admin controls university holiday lists, session start/end dates, and maximum allowed leaves per category.",
        "Audit Logging: Every attendance modification is logged with user ID, IP address, and timestamp."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide19, "18_track_admin_console.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Admin Master Controls & Institutional System Configuration")

    # =========================================================================
    # SLIDE 20: TECH SLIDE 1 — LIGHTWEIGHT, HIGH-PERFORMANCE MONOREPO
    # =========================================================================
    slide20 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide20, COLOR_BG_LIGHT)
    add_header(slide20, "Technology Advantage: Lightweight, Ultra-Fast MERN Architecture", "Core Technology")
    add_footer(slide20, 20)

    # 3 Technology Feature Cards
    tw = Inches(3.64)
    th = Inches(4.8)
    ty = Inches(1.6)

    tcards = [
        {
            "tag": "ZERO ERP BLOATWARE",
            "title": "React (Vite) + Express Architecture",
            "desc": "Built using modern React Single Page Application (SPA) with Vite. Pages load in milliseconds under 0.8s even on slow internet connections in hilly areas, unlike heavy proprietary ERPs that crash under peak load."
        },
        {
            "tag": "DURABLE STORAGE",
            "title": "Centralized MongoDB Monorepo",
            "desc": "A unified database powers Gateway, ScholarSync, and ScholarTrack. Candidate records, credentials, and SH-numbers are shared seamlessly across modules without redundant data entry or desynchronization."
        },
        {
            "tag": "ENTERPRISE SECURITY",
            "title": "Role-Based Access Control & SSL",
            "desc": "Bank-grade JWT session authentication with bcrypt password hashing. Granular role-based permissions (Scholar, Guide, HOD, Dean, Admin) with end-to-end HTTPS SSL encryption on all university subdomains."
        }
    ]

    for idx, tc in enumerate(tcards):
        tx = Inches(0.8) + idx * Inches(4.0)
        box = slide20.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, tx, ty, tw, th)
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD_BG
        box.line.color.rgb = COLOR_BORDER
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.28)

        p = tf.paragraphs[0]
        p.text = tc["tag"]
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_TEAL
        p.font.name = "Segoe UI"

        p1 = tf.add_paragraph()
        p1.text = tc["title"]
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_PRIMARY_DARK
        p1.font.name = "Segoe UI"
        p1.space_before = Pt(6)

        p2 = tf.add_paragraph()
        p2.text = tc["desc"]
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.font.name = "Segoe UI"
        p2.space_before = Pt(12)

    # =========================================================================
    # SLIDE 21: TECH SLIDE 2 — PROGRESSIVE WEB APP (PWA) MOBILE APPS
    # =========================================================================
    slide21 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide21, COLOR_BG_LIGHT)
    add_header(slide21, "Mobile Accessibility: Progressive Web Apps (PWA) on Any Phone", "Core Technology")
    add_footer(slide21, 21)

    left_box = slide21.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(6.0), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "ZERO APP STORE FRICTION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Native Mobile Experience on Android & iOS"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "One-Click Direct Install: Users tap 'Install App' directly in Chrome or Safari. No waiting for Google Play Store or Apple App Store approval cycles.",
        "Ultra-Lightweight (<2MB): Occupies negligible phone storage. Perfect for students and busy professors.",
        "Optimized for Hilly Terrain Connectivity: Service worker caching allows offline review of attendance logs and cached profiles during intermittent mobile connectivity.",
        "Responsive Adaptive Layout: Designed specifically for handheld touch navigation with bottom action tabs and quick biometric login."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    # Two mobile device mockups side by side on right
    add_image_card(slide21, "19_mobile_pwa_track.png", Inches(7.2), Inches(1.5), Inches(2.6), Inches(5.2), "ScholarTrack PWA")
    add_image_card(slide21, "20_mobile_pwa_sync.png", Inches(10.1), Inches(1.5), Inches(2.6), Inches(5.2), "ScholarSync PWA")

    # =========================================================================
    # SLIDE 22: TECH SLIDE 3 — STALWART SMTP EMAIL INFRASTRUCTURE
    # =========================================================================
    slide22 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide22, COLOR_BG_LIGHT)
    add_header(slide22, "Enterprise Communications: Self-Hosted Stalwart SMTP Server", "Core Technology")
    add_footer(slide22, 22)

    left_box = slide22.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.0))
    tf = left_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    p.text = "DEPENDABLE TRANSACTIONAL MESSAGING"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_TEAL
    p.font.name = "Segoe UI"

    p1 = tf.add_paragraph()
    p1.text = "Automated Event-Driven University Alerts"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_DARK
    p1.font.name = "Segoe UI"
    p1.space_before = Pt(4)

    pts = [
        "Dedicated Mail Server: Powered by self-hosted high-throughput Stalwart SMTP server (admin@scholarhubhpu.in) with SPF, DKIM, and DMARC verification.",
        "Durable MongoDB Queue: Emails are queued via EmailQueue model and processed steadily by background worker processes with retry logic.",
        "Catalog of 39+ Trigger Events: Instant notifications for account verification, DRC meeting schedules, RAC reviews, leave approvals, and degree awards.",
        "Delivery Audit Trail: Live admin dashboard tracks delivery status, timestamps, and error diagnostics for 100% accountability."
    ]
    for pt in pts:
        p_pt = tf.add_paragraph()
        p_pt.text = f"• {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    add_image_card(slide22, "18_track_admin_console.png", Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2), "Admin Communications & Real-Time Delivery Tracking Logs")

    # =========================================================================
    # SLIDE 23: BEFORE VS AFTER COMPARISON MATRIX
    # =========================================================================
    slide23 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide23, COLOR_BG_LIGHT)
    add_header(slide23, "Transformation Summary: Before vs. After ScholarHub at HPU", "Strategic Summary")
    add_footer(slide23, 23)

    cw_half = Inches(5.6)
    ch_half = Inches(4.8)

    # Before Box (Red Tint)
    before_box = slide23.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), cw_half, ch_half)
    before_box.fill.solid()
    before_box.fill.fore_color.rgb = RGBColor(254, 242, 242)
    before_box.line.color.rgb = RGBColor(252, 165, 165)
    before_box.line.width = Pt(1.5)

    btf = before_box.text_frame
    btf.word_wrap = True
    btf.margin_left = btf.margin_right = btf.margin_top = Inches(0.28)

    bp0 = btf.paragraphs[0]
    bp0.text = "BEFORE SCHOLARHUB (Legacy Operations)"
    bp0.font.size = Pt(14)
    bp0.font.bold = True
    bp0.font.color.rgb = RGBColor(185, 28, 28)
    bp0.font.name = "Segoe UI"

    b_pts = [
        "Ph.D. files take weeks to travel between departmental desks and dean's office.",
        "Missing research synopses, handwritten RAC reviews, and untracked coursework.",
        "Paper registers for scholar attendance prone to proxy marking and disputes.",
        "Stipend disbursements vulnerable to statutory audit objections due to lack of proof.",
        "Frantic, months-long paper collation before NAAC peer team and NIRF rankings.",
        "No public visibility into HPU faculty research thrusts and active labs."
    ]
    for pt in b_pts:
        p_pt = btf.add_paragraph()
        p_pt.text = f"❌ {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    # After Box (Green Tint)
    after_box = slide23.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.6), cw_half, ch_half)
    after_box.fill.solid()
    after_box.fill.fore_color.rgb = RGBColor(240, 253, 244)
    after_box.line.color.rgb = RGBColor(134, 239, 172)
    after_box.line.width = Pt(1.5)

    atf = after_box.text_frame
    atf.word_wrap = True
    atf.margin_left = atf.margin_right = atf.margin_top = Inches(0.28)

    ap0 = atf.paragraphs[0]
    ap0.text = "AFTER SCHOLARHUB (Modern Digital Governance)"
    ap0.font.size = Pt(14)
    ap0.font.bold = True
    ap0.font.color.rgb = COLOR_PRIMARY_MID
    ap0.font.name = "Segoe UI"

    a_pts = [
        "Instant digital lifecycle forwarding with timestamped supervisor & HOD sign-offs.",
        "Structured digital records for every milestone: DRC, RAC, Turnitin, & Viva-Voce.",
        "Verified digital/biometric daily attendance with real-time 75% percentage gauge.",
        "100% audit-proof fellowship certificates for Accounts & Finance branch.",
        "One-click NAAC Criterion 3 & NIRF metrics export with verified proof links.",
        "Prestigious Public Academic Research Directory showcasing HPU globally."
    ]
    for pt in a_pts:
        p_pt = atf.add_paragraph()
        p_pt.text = f"✅ {pt}"
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = COLOR_TEXT_MAIN
        p_pt.font.name = "Segoe UI"
        p_pt.space_before = Pt(8)

    # =========================================================================
    # SLIDE 24: IMPLEMENTATION & ROLLOUT ROADMAP
    # =========================================================================
    slide24 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide24, COLOR_BG_LIGHT)
    add_header(slide24, "Institutional Implementation & Phased Rollout Roadmap", "Next Steps")
    add_footer(slide24, 24)

    rw = Inches(3.64)
    rh = Inches(4.8)
    ry = Inches(1.6)

    phases = [
        {
            "tag": "PHASE 1 (WEEKS 1 - 4)",
            "title": "Flagship Department Pilot",
            "points": [
                "Deploy pilot in 3 leading faculties (e.g. Computer Science, Biotechnology, Physics).",
                "Onboard active research scholars and supervisors.",
                "Conduct brief 30-minute orientation workshops for HODs and faculty.",
                "Verify live biometric / daily attendance & leave logging."
            ]
        },
        {
            "tag": "PHASE 2 (WEEKS 5 - 8)",
            "title": "University-Wide Rollout",
            "points": [
                "Expand to all Humanities, Social Sciences, Law, and Sciences departments.",
                "Backfill existing Ph.D. scholars with unique 9-digit SH numbers.",
                "Integrate institutional holiday calendars and departmental leave rules.",
                "Deploy PWA mobile app links across student notice boards."
            ]
        },
        {
            "tag": "PHASE 3 (WEEKS 9+)",
            "title": "Paperless Governance Integration",
            "points": [
                "Mandate digital DRC and RAC meeting logs across all faculties.",
                "Direct electronic synchronization with Finance branch for monthly stipend release.",
                "Automated NAAC Criterion 3 data compilation for upcoming accreditation.",
                "Complete operational transition to paperless research administration."
            ]
        }
    ]

    for idx, ph_item in enumerate(phases):
        px = Inches(0.8) + idx * Inches(4.0)
        box = slide24.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px, ry, rw, rh)
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD_BG
        box.line.color.rgb = COLOR_BORDER
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.28)

        p = tf.paragraphs[0]
        p.text = ph_item["tag"]
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_GOLD
        p.font.name = "Segoe UI"

        p1 = tf.add_paragraph()
        p1.text = ph_item["title"]
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_PRIMARY_DARK
        p1.font.name = "Segoe UI"
        p1.space_before = Pt(6)

        for pt in ph_item["points"]:
            p_pt = tf.add_paragraph()
            p_pt.text = f"• {pt}"
            p_pt.font.size = Pt(11)
            p_pt.font.color.rgb = COLOR_TEXT_MAIN
            p_pt.font.name = "Segoe UI"
            p_pt.space_before = Pt(8)

    # =========================================================================
    # SLIDE 25: CLOSING & LEADERSHIP ADOPTION PROPOSAL
    # =========================================================================
    slide25 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide25, COLOR_PRIMARY_DARK)

    top_strip25 = slide25.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    top_strip25.fill.solid()
    top_strip25.fill.fore_color.rgb = COLOR_ACCENT_GOLD
    top_strip25.line.fill.background()

    if os.path.exists(logo_path):
        slide25.shapes.add_picture(logo_path, Inches(5.9), Inches(1.1), width=Inches(1.5))

    tb = slide25.shapes.add_textbox(Inches(1.5), Inches(2.7), Inches(10.3), Inches(3.8))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "Thank You, Hon'ble Vice Chancellor & University Officers"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.font.name = "Segoe UI"
    p.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "ScholarHub is Ready for Immediate Institutional Pilot at H.P. University"
    p2.font.size = Pt(18)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_ACCENT_GOLD
    p2.font.name = "Segoe UI"
    p2.space_before = Pt(10)
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf.add_paragraph()
    p3.text = "• Zero New Hardware Investment Required  • Fully Deployed & Verified Live on Cloud Servers\n• PWA Mobile Apps Ready for All Faculty & Scholars  • Automated NAAC & UGC Regulatory Compliance"
    p3.font.size = Pt(13)
    p3.font.color.rgb = COLOR_TEXT_LIGHT
    p3.font.name = "Segoe UI"
    p3.space_before = Pt(16)
    p3.alignment = PP_ALIGN.CENTER

    p4 = tf.add_paragraph()
    p4.text = "Open for Leadership Questions & Discussion"
    p4.font.size = Pt(14)
    p4.font.bold = True
    p4.font.color.rgb = RGBColor(167, 243, 208)
    p4.font.name = "Segoe UI"
    p4.space_before = Pt(24)
    p4.alignment = PP_ALIGN.CENTER

    prs.save(OUTPUT_PPTX)
    print(f"Master PowerPoint presentation saved successfully to: {OUTPUT_PPTX}")

if __name__ == "__main__":
    create_deck()
