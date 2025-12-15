import { supabase } from '@/integrations/supabase/client';

export interface LocalizationKeyValue {
  key: string;
  value: string;
}

/**
 * Get localization data in key-value format for a specific resource type and culture
 * Key = English translation (en-US), Value = Selected language translation
 */
export async function getLocalizationJSON(
  resourceType: string = 'SmartPhone_Picking_APP',
  cultureCode: string = 'he-IL'
): Promise<LocalizationKeyValue[]> {
  try {
    console.log('🌍 Fetching localization:', { resourceType, cultureCode });

    // Get translations for the selected language
    const { data: selectedLangData, error: selectedError } = await supabase
      .from('localization_resources')
      .select('resource_key, resource_value')
      .eq('resource_type', resourceType)
      .eq('culture_code', cultureCode)
      .order('resource_key', { ascending: true });

    if (selectedError) {
      console.error('❌ Error fetching selected language data:', selectedError);
      throw selectedError;
    }

    console.log(`✅ Found ${selectedLangData?.length || 0} translations for ${cultureCode}`);

    // Get English translations for the keys
    const { data: englishData, error: englishError } = await supabase
      .from('localization_resources')
      .select('resource_key, resource_value')
      .eq('resource_type', resourceType)
      .eq('culture_code', 'en-US')
      .order('resource_key', { ascending: true });

    if (englishError) {
      console.error('❌ Error fetching English data:', englishError);
      throw englishError;
    }

    console.log(`✅ Found ${englishData?.length || 0} English translations`);

    // Create a map of resource_key -> English value
    const englishMap = new Map(
      (englishData || []).map(item => [item.resource_key, item.resource_value || item.resource_key])
    );

    // Combine: key = English, value = Selected language
    const result = (selectedLangData || []).map((item) => ({
      key: englishMap.get(item.resource_key) || item.resource_key, // English translation or fallback to resource_key
      value: item.resource_value || '',
    }));

    console.log('📦 Result sample (first 3):', result.slice(0, 3));

    return result;
  } catch (error) {
    console.error('❌ Error in getLocalizationJSON:', error);
    throw error;
  }
}

/**
 * Get all localization data grouped by resource type and culture
 */
export async function getAllLocalizationData() {
  try {
    const { data, error } = await supabase
      .from('localization_resources')
      .select('*')
      .order('resource_type', { ascending: true })
      .order('culture_code', { ascending: true })
      .order('resource_key', { ascending: true });

    if (error) {
      console.error('Error fetching all localization data:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllLocalizationData:', error);
    throw error;
  }
}

