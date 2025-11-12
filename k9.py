

import json
import requests
import random

# ======== CONFIGURATION ========
ACCESS_TOKEN = "EAAVLZCZBw38D8BP4KrCFHURK8p2WgnbujWHI7swZClflwoj6fXJsc5pLHAPZAwLrX2E5vSrl2wSpgduZALGwgzEQCPegyZBHPlkyrWf8K72BR2ZBOhGlWWOzVjriGZADAijk0EBzvGD8ldQxhv0kiVoZCxPF9bZALo1VBLYOZADvKUZBAZCyRZBwZB6nn7diB3ijdgbMSMBU12LLn87iNY2RbhTMjQ8Wtos99p0TKfSvXnXUGjF1KlfN0ZCnHzMmGNWs5dXaHtQEMXfZAf7OVDP9cGp0z2v4VejNk"  # Replace with your temporary token
PHONE_NUMBER_ID = "811567088700493"      # e.g. 123456789012345
RECIPIENT_NUMBER = "+919030204966"    # e.g. +919876543210 (must be in international format)
TEMPLATE_NAME = "otp_verification"

# Generate a 6-digit OTP
OTP = str(random.randint(100000, 999999))

# ======== DO NOT EDIT BELOW ========
url = f"https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "messaging_product": "whatsapp",
    "to": RECIPIENT_NUMBER,
    "type": "template",
    "template": {
        "name": TEMPLATE_NAME,
        "language": {"code": "en_US"},
        "components": [
            {
                "type": "body",
                "parameters": [
                    {
                        "type": "text",
                        "text": OTP
                    }
                ]
            },
            {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                    {
                        "type": "text",
                        "text": OTP
                    }
                ]
            }
        ]
    }
}

try:
    print(f"🔐 Generated OTP: {OTP}")
    print(f"📱 Sending to: {RECIPIENT_NUMBER}")
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print("Response Status Code:", response.status_code)
    # === RESPONSE HANDLING ===
    if response.status_code == 200:
        print("✅ Message sent successfully!")
    else:
        print("❌ Failed to send message!")
        print("Status Code:", response.status_code)
        print("Response:", response.text)

except Exception as e:
    print("Error:", e)