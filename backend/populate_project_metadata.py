import os
import django
import sys
import requests

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from operation.models import ProjectStatus, ProjectStage, Currency

def populate_statuses():
    print("Populating Project Statuses...")
    statuses = [
        ("Not Started", "Project has been created but work hasn't begun."),
        ("In Progress", "Work is currently being performed."),
        ("On Hold", "Project is temporarily paused."),
        ("Completed", "All project deliverables have been met."),
        ("Cancelled", "Project has been terminated before completion."),
    ]
    for name, desc in statuses:
        status, created = ProjectStatus.objects.get_or_create(name=name, defaults={'description': desc})
        if created:
            print(f"  Created status: {name}")

def populate_stages():
    print("Populating Project Stages...")
    stages = [
        ("Prospecting", "Initial contact and discovery phase."),
        ("Proposal Sent", "A formal proposal has been submitted to the client."),
        ("Negotiation", "Discussing terms and adjustments."),
        ("Contract Signed", "Legal agreement has been finalized."),
        ("Kickoff", "Initial project meeting and planning."),
        ("Execution", "Core development/delivery phase."),
        ("QA & Testing", "Quality assurance and final checks."),
        ("Handover", "Final delivery and project closure."),
    ]
    for name, desc in stages:
        stage, created = ProjectStage.objects.get_or_create(name=name, defaults={'description': desc})
        if created:
            print(f"  Created stage: {name}")

def populate_currencies():
    print("Populating Currencies (fetching from REST Countries API)...")
    try:
        response = requests.get("https://restcountries.com/v3.1/all?fields=currencies")
        if response.status_code == 200:
            countries_data = response.json()
            currency_map = {}
            
            for country in countries_data:
                currencies = country.get('currencies', {})
                for code, details in currencies.items():
                    if code and details.get('name'):
                        currency_map[code] = {
                            'name': details.get('name'),
                            'symbol': details.get('symbol', '')
                        }
            
            # Common additions/fixes if needed
            if 'USD' not in currency_map:
                currency_map['USD'] = {'name': 'US Dollar', 'symbol': '$'}
            if 'INR' not in currency_map:
                currency_map['INR'] = {'name': 'Indian Rupee', 'symbol': '₹'}

            for code, info in currency_map.items():
                curr, created = Currency.objects.get_or_create(
                    code=code, 
                    defaults={
                        'name': info['name'], 
                        'symbol': info['symbol'],
                        'is_active': True
                    }
                )
                if created:
                    print(f"  Created currency: {code} - {info['name']}")
            print(f"Successfully processed {len(currency_map)} currencies.")
        else:
            print(f"Failed to fetch currencies: Status {response.status_code}")
    except Exception as e:
        print(f"Error fetching currencies: {e}")

if __name__ == "__main__":
    populate_statuses()
    populate_stages()
    populate_currencies()
    print("Done!")
