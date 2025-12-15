/**
 * Script to translate Hebrew texts to English, Romanian, and Thai using Playwright
 * This script uses Google Translate via Playwright automation
 */

import { chromium } from 'playwright';
import { supabase } from '../src/integrations/supabase/client';

const GOOGLE_TRANSLATE_URL = 'https://translate.google.com/?sl=he&tl=';

async function translateWithGoogleTranslate(text: string, targetLang: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const langMap: Record<string, string> = {
      'en-US': 'en',
      'ro-RO': 'ro',
      'th-TH': 'th',
    };
    
    const targetLangCode = langMap[targetLang] || 'en';
    const url = `${GOOGLE_TRANSLATE_URL}${targetLangCode}&text=${encodeURIComponent(text)}`;
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for translation to appear
    await page.waitForSelector('span[data-language-to]', { timeout: 10000 });
    
    // Get translated text
    const translatedText = await page.evaluate(() => {
      const elements = document.querySelectorAll('span[data-language-to]');
      if (elements.length > 0) {
        return elements[0].textContent || '';
      }
      return '';
    });
    
    await browser.close();
    return translatedText.trim();
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function translateAllHebrew() {
  console.log('Starting translation process...');
  
  // Fetch all Hebrew translations
  const { data: hebrewData, error: fetchError } = await supabase
    .from('localization_resources')
    .select('*')
    .eq('culture_code', 'he-IL')
    .order('resource_key', { ascending: true });

  if (fetchError) {
    console.error('Error fetching Hebrew data:', fetchError);
    return;
  }

  if (!hebrewData || hebrewData.length === 0) {
    console.log('No Hebrew translations found');
    return;
  }

  console.log(`Found ${hebrewData.length} Hebrew translations`);

  const targetLanguages: ('en-US' | 'ro-RO' | 'th-TH')[] = ['en-US', 'ro-RO', 'th-TH'];
  let translated = 0;
  let errors = 0;

  for (const hebrewItem of hebrewData) {
    if (!hebrewItem.resource_value || hebrewItem.resource_value.trim() === '') {
      continue;
    }

    for (const targetLang of targetLanguages) {
      try {
        // Check if translation already exists
        const { data: existing } = await supabase
          .from('localization_resources')
          .select('id, resource_value')
          .eq('resource_type', hebrewItem.resource_type)
          .eq('culture_code', targetLang)
          .eq('resource_key', hebrewItem.resource_key)
          .maybeSingle();

        // Skip if translation already exists and has a value
        if (existing?.resource_value && existing.resource_value.trim() !== '') {
          console.log(`Skipping ${hebrewItem.resource_key} -> ${targetLang} (already exists)`);
          continue;
        }

        console.log(`Translating ${hebrewItem.resource_key} -> ${targetLang}...`);
        
        // Translate using Playwright
        const translatedText = await translateWithGoogleTranslate(
          hebrewItem.resource_value,
          targetLang
        );

        if (!translatedText) {
          throw new Error('Translation returned empty');
        }

        // Save translation
        if (existing) {
          const { error: updateError } = await supabase
            .from('localization_resources')
            .update({ resource_value: translatedText })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('localization_resources')
            .insert({
              resource_type: hebrewItem.resource_type,
              culture_code: targetLang,
              resource_key: hebrewItem.resource_key,
              resource_value: translatedText,
            });

          if (insertError) throw insertError;
        }

        translated++;
        console.log(`✓ Translated: ${hebrewItem.resource_key} -> ${targetLang}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        errors++;
        console.error(`✗ Error translating ${hebrewItem.resource_key} -> ${targetLang}:`, error);
      }
    }
  }

  console.log(`\nTranslation complete!`);
  console.log(`Translated: ${translated}`);
  console.log(`Errors: ${errors}`);
}

// Run translation
translateAllHebrew().catch(console.error);

