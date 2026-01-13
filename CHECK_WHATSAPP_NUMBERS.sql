-- Check WhatsApp phone number formats in the database
-- Run this to see how phone numbers are stored

SELECT 
  id,
  full_name,
  email,
  whatsapp_number,
  notification_method,
  LENGTH(whatsapp_number) as number_length,
  CASE 
    WHEN whatsapp_number LIKE '+%' THEN '✅ Has + prefix (E.164 format)'
    ELSE '❌ Missing + prefix - needs fixing'
  END as format_status,
  CASE 
    WHEN whatsapp_number LIKE '+1%' AND LENGTH(whatsapp_number) = 12 THEN '✅ US format (+1XXXXXXXXXX)'
    WHEN whatsapp_number LIKE '+%' THEN '⚠️ Has + but check country code'
    ELSE '❌ Invalid format'
  END as format_details
FROM users
WHERE whatsapp_number IS NOT NULL
ORDER BY created_at DESC;

-- If you need to fix phone numbers that are missing the + prefix:
-- (Uncomment and modify as needed)
/*
UPDATE users
SET whatsapp_number = CASE
  WHEN whatsapp_number NOT LIKE '+%' AND LENGTH(whatsapp_number) = 10 THEN '+1' || whatsapp_number
  WHEN whatsapp_number NOT LIKE '+%' AND LENGTH(whatsapp_number) = 11 AND whatsapp_number LIKE '1%' THEN '+' || whatsapp_number
  ELSE whatsapp_number
END
WHERE whatsapp_number IS NOT NULL 
  AND whatsapp_number NOT LIKE '+%';
*/

