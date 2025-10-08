"""
Services package for the event coordination application.
"""

# Import only the services that exist
from .availability_calc import AvailabilityCalc

__all__ = ['AvailabilityCalc']