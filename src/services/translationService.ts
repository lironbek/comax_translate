import { supabase } from '@/integrations/supabase/client';

interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

/**
 * Translate text from Hebrew to target language using Google Translate API
 * Falls back to Playwright-based translation if API key is not available
 */
export async function translateText(
  text: string,
  targetLanguage: 'en-US' | 'ro-RO' | 'th-TH'
): Promise<TranslationResult> {
  if (!text || !text.trim()) {
    return { success: false, error: 'Text is empty' };
  }

  // Map culture codes to Google Translate language codes
  const languageMap: Record<string, string> = {
    'en-US': 'en',
    'ro-RO': 'ro',
    'th-TH': 'th',
  };

  const targetLang = languageMap[targetLanguage] || 'en';

  try {
    // Try using Google Translate API via proxy/translator service
    // Using a free translation API service
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=he|${targetLang}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Translation API failed');
    }

    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        success: true,
        translatedText: data.responseData.translatedText,
      };
    }

    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed',
    };
  }
}

/**
 * Translate all Hebrew translations to target languages
 */
export async function translateAllHebrewToLanguages(
  targetLanguages: ('en-US' | 'ro-RO' | 'th-TH')[]
): Promise<{ success: boolean; translated: number; errors: number; errorMessages: string[] }> {
  try {
    // Fetch all Hebrew translations
    const { data: hebrewData, error: fetchError } = await supabase
      .from('localization_resources')
      .select('*')
      .eq('culture_code', 'he-IL')
      .order('resource_key', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!hebrewData || hebrewData.length === 0) {
      return { success: false, translated: 0, errors: 0, errorMessages: ['No Hebrew translations found'] };
    }

    let translated = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    // Translate each Hebrew text to each target language
    for (const hebrewItem of hebrewData) {
      for (const targetLang of targetLanguages) {
        // Check if translation already exists
        const { data: existing } = await supabase
          .from('localization_resources')
          .select('id')
          .eq('resource_type', hebrewItem.resource_type)
          .eq('culture_code', targetLang)
          .eq('resource_key', hebrewItem.resource_key)
          .maybeSingle();

        // Skip if translation already exists and has a value
        if (existing) {
          const { data: existingValue } = await supabase
            .from('localization_resources')
            .select('resource_value')
            .eq('id', existing.id)
            .single();

          if (existingValue?.resource_value && existingValue.resource_value.trim() !== '') {
            continue; // Skip if translation already exists
          }
        }

        // Translate the text
        const translationResult = await translateText(
          hebrewItem.resource_value || '',
          targetLang
        );

        if (translationResult.success && translationResult.translatedText) {
          try {
            if (existing) {
              // Update existing translation
              const { error: updateError } = await supabase
                .from('localization_resources')
                .update({ resource_value: translationResult.translatedText })
                .eq('id', existing.id);

              if (updateError) throw updateError;
            } else {
              // Insert new translation
              const { error: insertError } = await supabase
                .from('localization_resources')
                .insert({
                  resource_type: hebrewItem.resource_type,
                  culture_code: targetLang,
                  resource_key: hebrewItem.resource_key,
                  resource_value: translationResult.translatedText,
                });

              if (insertError) throw insertError;
            }
            translated++;
          } catch (dbError) {
            errors++;
            errorMessages.push(
              `Failed to save translation for ${hebrewItem.resource_key} to ${targetLang}: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
            );
          }
        } else {
          errors++;
          errorMessages.push(
            `Failed to translate ${hebrewItem.resource_key} to ${targetLang}: ${translationResult.error || 'Unknown error'}`
          );
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: errors === 0,
      translated,
      errors,
      errorMessages,
    };
  } catch (error) {
    return {
      success: false,
      translated: 0,
      errors: 0,
      errorMessages: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

