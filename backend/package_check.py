import re
import os
import sys
import pkg_resources

# Step 1: Set the directory you want to scan (change this to your project folder)
project_path = "/Users/yonidayagi/Desktop/when/when/backend"

# List of known mappings from import name to package name
package_name_mapping = {
    'mysql': 'mysql-connector-python',
    'flask_sqlalchemy': 'Flask-SQLAlchemy',
    'flask_cors': 'Flask-Cors',
    'google_auth_oauthlib': 'google-auth-oauthlib',
    'googleapiclient': 'google-api-python-client'
}

# Step 2: Extract all import statements from every .py file in the project folder
def get_imported_modules_from_file(file_path):
    """Extract imported modules from a file."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        file_contents = f.read()
    # Regular expression to match `import module` and `from module import something`
    imported_modules = set(re.findall(r'^\s*(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_\.]*)', file_contents, re.MULTILINE))
    # Extract just the top-level module names (e.g., 'os.path' becomes 'os')
    top_level_modules = {module.split('.')[0] for module in imported_modules}
    return top_level_modules

# Step 3: Walk through the project folder and get all Python files
all_imported_modules = set()
for root, _, files in os.walk(project_path):
    for file in files:
        if file.endswith('.py'):
            file_path = os.path.join(root, file)
            imported_modules = get_imported_modules_from_file(file_path)
            all_imported_modules.update(imported_modules)

# Step 4: Get the list of installed packages
installed_packages = {package.key for package in pkg_resources.working_set}
# Include known mappings for package names
installed_packages.update(package_name_mapping.values())

# Add standard library modules to ignore them
if hasattr(sys, 'stdlib_module_names'):
    standard_library_modules = set(sys.stdlib_module_names)
else:
    standard_library_modules = {'os', 'sys', 'json', 're', 'datetime', 'traceback', 'sqlite3', 'zoneinfo'}

# Step 5: Cross-reference imports with installed packages
used_installed_packages = all_imported_modules.intersection(installed_packages)
# Include known mappings (so 'mysql' is recognized as 'mysql-connector-python')
for module in all_imported_modules:
    if module in package_name_mapping:
        used_installed_packages.add(package_name_mapping[module])

# Print only the packages that are installed and used in the folder
print("\nInstalled Packages That Are Used in Your Project:")
for package in sorted(used_installed_packages):
    print(package)
