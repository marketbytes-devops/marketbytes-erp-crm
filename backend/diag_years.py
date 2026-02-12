import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from hr.models import Overtime

def test_years():
    current_year = timezone.now().year
    print(f"Current Year: {current_year}")
    
    range_years = list(range(2020, current_year + 6))
    print(f"Range Years: {range_years}")
    
    data_years = Overtime.objects.dates('date', 'year')
    data_year_list = [date.year for date in data_years]
    print(f"Data Years: {data_year_list}")
    
    final_years = sorted(list(set(range_years + data_year_list)), reverse=True)
    print(f"Final Years: {final_years}")
    
    response_data = [{"value": y, "label": str(y)} for y in final_years]
    print(f"Response Data Length: {len(response_data)}")
    print(f"First 5: {response_data[:5]}")

if __name__ == "__main__":
    test_years()
