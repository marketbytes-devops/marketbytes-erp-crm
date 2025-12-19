from django.db import models
from hr.models import Employee 

from django.contrib.auth import get_user_model
User = get_user_model()

# Proposal Template Model
class ProposalTemplate(models.Model):
    name = models.CharField(max_length=255)
    template = models.CharField(max_length=255, blank=True, null=True)  # Short name or title
    body = models.TextField()  # Rich text / HTML content
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposal_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Proposal Templates"

    def __str__(self):
        return self.name


# RFP Body Template Model
class RfpTemplate(models.Model):
    category = models.CharField(max_length=255)
    body = models.TextField()  # Rich text / HTML content
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rfp_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category']
        verbose_name_plural = "RFP Body Templates"

    def __str__(self):
        return self.category# For Lead Agent (assuming Employee model exists or will be created)

class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    website = models.URLField(blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    office_phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name


class Client(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients')
    mobile = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.email})"


class LeadSource(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Lead Sources"


class LeadCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Lead Categories"


class LeadTeam(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Lead Teams"


class Lead(models.Model):
    STATUS_CHOICES = [
        ('new_lead', 'New Lead'),
        ('connected', 'Connected'),
        ('proposal_sent', 'Proposal Sent'),
        ('closed_won', 'Closed Won'),
        ('closed_lost', 'Closed Lost'),
    ]

    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    lead_agent = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    lead_source = models.ForeignKey(LeadSource, on_delete=models.SET_NULL, null=True, blank=True)
    lead_category = models.ForeignKey(LeadCategory, on_delete=models.SET_NULL, null=True, blank=True)
    lead_team = models.ForeignKey(LeadTeam, on_delete=models.SET_NULL, null=True, blank=True)

    lead_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    next_follow_up = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new_lead')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Leads"

    def __str__(self):
        client_name = self.client.name if self.client else "No Client"
        company_name = self.company.name if self.company else "No Company"
        return f"{client_name} - {company_name}"