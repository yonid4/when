#!/bin/bash

# Fix Google OAuth redirect URI for local development
# This script updates the .env file to use localhost instead of EC2 URL

echo "🔧 Fixing Google OAuth redirect URI for local development..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file first."
    exit 1
fi

# Backup current .env
cp .env .env.backup
echo "✅ Created backup: .env.backup"

# Update or add GOOGLE_REDIRECT_URI
if grep -q "GOOGLE_REDIRECT_URI" .env; then
    # Replace existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback|' .env
    else
        # Linux
        sed -i 's|GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback|' .env
    fi
    echo "✅ Updated GOOGLE_REDIRECT_URI in .env"
else
    # Add new line
    echo "" >> .env
    echo "GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback" >> .env
    echo "✅ Added GOOGLE_REDIRECT_URI to .env"
fi

echo ""
echo "📝 Next steps:"
echo "1. Add this redirect URI to Google Cloud Console:"
echo "   http://localhost:5000/api/auth/google/callback"
echo ""
echo "2. Go to: https://console.cloud.google.com/apis/credentials"
echo "3. Click your OAuth 2.0 Client ID"
echo "4. Add the URL above to 'Authorized redirect URIs'"
echo "5. Save"
echo ""
echo "3. Restart your Flask backend server"
echo ""
echo "✨ Done! Your OAuth should now work with localhost."


