from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.colors import darkblue

styles = getSampleStyleSheet()

title_style = styles["Heading1"]
title_style.alignment = TA_CENTER
title_style.textColor = darkblue

heading_style = styles["Heading2"]

normal = styles["BodyText"]


def generate_pdf(filename, rankings, job_description):

    doc = SimpleDocTemplate(filename)

    story = []

    # -------------------------
    # Title
    # -------------------------

    story.append(
        Paragraph("TalentIQ AI Recruitment Report", title_style)
    )

    story.append(Spacer(1, 20))

    # -------------------------
    # Job Description
    # -------------------------

    story.append(
        Paragraph("<b>Job Description</b>", heading_style)
    )

    story.append(
        Paragraph(job_description, normal)
    )

    story.append(Spacer(1, 20))

    # -------------------------
    # Candidate Rankings
    # -------------------------

    story.append(
        Paragraph("<b>Candidate Rankings</b>", heading_style)
    )

    story.append(Spacer(1, 10))

    for i, candidate in enumerate(rankings):

        story.append(
            Paragraph(
                f"<b>{i+1}. {candidate['name']}</b>",
                heading_style,
            )
        )

        story.append(
            Paragraph(
                f"Overall Score : {candidate['score']}",
                normal,
            )
        )

        story.append(
            Paragraph(
                f"Skill Match : {candidate['skillMatch']}%",
                normal,
            )
        )

        story.append(
            Paragraph(
                f"Recommendation : {candidate['recommendation']}",
                normal,
            )
        )

        story.append(
            Paragraph(
                f"<b>AI Feedback</b><br/>{candidate.get('feedback','')}",
                normal,
            )
        )

        story.append(
            Paragraph(
                "<b>Strengths</b>",
                normal,
            )
        )

        for s in candidate.get("strengths", []):

            story.append(
                Paragraph(f"• {s}", normal)
            )

        story.append(
            Paragraph(
                "<b>Weaknesses</b>",
                normal,
            )
        )

        for w in candidate.get("weaknesses", []):

            story.append(
                Paragraph(f"• {w}", normal)
            )

        story.append(
            Paragraph(
                "<b>Missing Skills</b>",
                normal,
            )
        )

        for m in candidate.get("missingSkills", []):

            story.append(
                Paragraph(f"• {m}", normal)
            )

        story.append(Spacer(1, 25))

    doc.build(story)