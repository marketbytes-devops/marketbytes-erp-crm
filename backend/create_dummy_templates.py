#!/usr/bin/env python
"""
Script to create dummy Proposal and RFP templates
Run with: python manage.py shell < create_dummy_templates.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from sales.models import ProposalTemplate, RfpTemplate
from django.contrib.auth import get_user_model

User = get_user_model()

# Get the first user (usually admin)
user = User.objects.first()

# Clear existing templates (optional)
# ProposalTemplate.objects.all().delete()
# RfpTemplate.objects.all().delete()

# Create Proposal Templates
prop1, created = ProposalTemplate.objects.get_or_create(
    name="Standard Proposal",
    defaults={
        "template": "standard_proposal",
        "body": """<h2>Project Proposal</h2>
<p>Dear [Client Name],</p>
<p>Thank you for considering our services. We are pleased to submit the following proposal:</p>
<h3>Overview</h3>
<p>This proposal outlines the scope of work, deliverables, timeline, and investment required for your project.</p>
<h3>Scope of Work</h3>
<ul>
<li>Requirement analysis and planning</li>
<li>Design and development</li>
<li>Testing and QA</li>
<li>Deployment and support</li>
</ul>
<h3>Timeline</h3>
<p>Project Duration: 4-6 weeks</p>
<h3>Investment</h3>
<p>Total Cost: [Amount] USD</p>
<p>Payment Terms: 50% upfront, 50% on completion</p>
<p>We look forward to working with you!</p>
<p>Best regards,<br>MarketBytes Team</p>""",
        "created_by": user
    }
)

prop2, created = ProposalTemplate.objects.get_or_create(
    name="Software Development Proposal",
    defaults={
        "template": "software_dev",
        "body": """<h2>Software Development Proposal</h2>
<p>Dear [Client Name],</p>
<p>We are excited to propose a comprehensive software development solution tailored to your business needs.</p>
<h3>Project Scope</h3>
<p>We will develop a custom web/mobile application with the following features:</p>
<ul>
<li>User authentication and role-based access</li>
<li>Real-time data synchronization</li>
<li>API integration</li>
<li>Responsive design</li>
<li>Advanced analytics dashboard</li>
</ul>
<h3>Deliverables</h3>
<ul>
<li>Fully functional application</li>
<li>Source code and documentation</li>
<li>30 days of free support</li>
<li>User training sessions</li>
</ul>
<h3>Cost Breakdown</h3>
<p>Development: [Amount] USD<br>
Deployment: [Amount] USD<br>
Training: [Amount] USD<br>
Total: [Amount] USD</p>
<p>Thank you for the opportunity!</p>""",
        "created_by": user
    }
)

# Create RFP Templates
rfp1, created = RfpTemplate.objects.get_or_create(
    category="IT Infrastructure",
    defaults={
        "body": """<h2>Request for Proposal - IT Infrastructure</h2>
<h3>Background</h3>
<p>Our organization is seeking proposals for modernizing our IT infrastructure to support business growth.</p>
<h3>Requirements</h3>
<ul>
<li>Cloud migration planning</li>
<li>Network architecture design</li>
<li>Security assessment</li>
<li>Disaster recovery setup</li>
<li>24/7 managed support</li>
</ul>
<h3>Timeline</h3>
<p>Proposal Submission Deadline: [Date]</p>
<p>Project Start Date: [Date]</p>
<p>Project Duration: 3-6 months</p>
<h3>Evaluation Criteria</h3>
<ul>
<li>Technical expertise (40%)</li>
<li>Cost-effectiveness (35%)</li>
<li>Support and SLA (25%)</li>
</ul>
<p>Please submit detailed proposals by the specified deadline.</p>""",
        "created_by": user
    }
)

rfp2, created = RfpTemplate.objects.get_or_create(
    category="Marketing & Branding",
    defaults={
        "body": """<h2>Request for Proposal - Marketing & Branding</h2>
<h3>Project Overview</h3>
<p>We are seeking a creative agency to develop a comprehensive digital marketing and branding strategy.</p>
<h3>Scope</h3>
<ul>
<li>Brand identity design (logo, colors, typography)</li>
<li>Website redesign and development</li>
<li>Social media strategy and content calendar</li>
<li>Email marketing campaigns</li>
<li>SEO optimization</li>
</ul>
<h3>Budget Range</h3>
<p>$15,000 - $30,000</p>
<h3>Deliverables</h3>
<ul>
<li>Brand guidelines document</li>
<li>Responsive website</li>
<li>3-month content calendar</li>
<li>Monthly performance reports</li>
</ul>
<p>We look forward to your creative proposals!</p>""",
        "created_by": user
    }
)

print("\n✅ Templates Created Successfully!\n")
print("📋 Proposal Templates:")
print(f"   • {prop1.name}")
print(f"   • {prop2.name}")
print("\n📋 RFP Templates:")
print(f"   • {rfp1.category}")
print(f"   • {rfp2.category}")
print("\nYou can now use these templates in the Communication section!\n")
