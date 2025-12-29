import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { translateAllHebrewToLanguagesWithProgress } from '@/services/translationService';
import { AppLayout } from '@/components/AppLayout';

interface Language {
  id?: string;
  code: string;
  name: string;
  native_name: string;
  direction: 'ltr' | 'rtl';
  is_active: boolean;
}

// Default languages (fallback if database is not available)
const DEFAULT_LANGUAGES: Language[] = [
  { code: 'he-IL', name: 'Hebrew', native_name: 'עברית', direction: 'rtl', is_active: true },
  { code: 'en-US', name: 'English', native_name: 'English', direction: 'ltr', is_active: true },
  { code: 'ro-RO', name: 'Romanian', native_name: 'Română', direction: 'ltr', is_active: true },
  { code: 'th-TH', name: 'Thai', native_name: 'ไทย', direction: 'ltr', is_active: true },
  { code: 'ar-SA', name: 'Arabic', native_name: 'العربية', direction: 'rtl', is_active: true },
];

// Common languages for adding
const AVAILABLE_LANGUAGES = [
  { code: 'fr-FR', name: 'French', native_name: 'Français', direction: 'ltr' as const },
  { code: 'de-DE', name: 'German', native_name: 'Deutsch', direction: 'ltr' as const },
  { code: 'es-ES', name: 'Spanish', native_name: 'Español', direction: 'ltr' as const },
  { code: 'it-IT', name: 'Italian', native_name: 'Italiano', direction: 'ltr' as const },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', native_name: 'Português', direction: 'ltr' as const },
  { code: 'ru-RU', name: 'Russian', native_name: 'Русский', direction: 'ltr' as const },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native_name: '简体中文', direction: 'ltr' as const },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native_name: '繁體中文', direction: 'ltr' as const },
  { code: 'ja-JP', name: 'Japanese', native_name: '日本語', direction: 'ltr' as const },
  { code: 'ko-KR', name: 'Korean', native_name: '한국어', direction: 'ltr' as const },
  { code: 'hi-IN', name: 'Hindi', native_name: 'हिन्दी', direction: 'ltr' as const },
  { code: 'tr-TR', name: 'Turkish', native_name: 'Türkçe', direction: 'ltr' as const },
  { code: 'pl-PL', name: 'Polish', native_name: 'Polski', direction: 'ltr' as const },
  { code: 'nl-NL', name: 'Dutch', native_name: 'Nederlands', direction: 'ltr' as const },
  { code: 'vi-VN', name: 'Vietnamese', native_name: 'Tiếng Việt', direction: 'ltr' as const },
  { code: 'uk-UA', name: 'Ukrainian', native_name: 'Українська', direction: 'ltr' as const },
  { code: 'fa-IR', name: 'Persian', native_name: 'فارسی', direction: 'rtl' as const },
  { code: 'ur-PK', name: 'Urdu', native_name: 'اردو', direction: 'rtl' as const },
];

export default function Languages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLanguageToAdd, setSelectedLanguageToAdd] = useState<string>('');
  const [useDatabase, setUseDatabase] = useState(false);
  const [translatingLanguage, setTranslatingLanguage] = useState<string | null>(null);
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = languages.filter(
        (lang) =>
          lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.native_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLanguages(filtered);
    } else {
      setFilteredLanguages(languages);
    }
  }, [searchQuery, languages]);

  const loadLanguages = async () => {
    setIsLoading(true);

    // Try to load from database first
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) {
        setLanguages(data);
        setFilteredLanguages(data);
        setUseDatabase(true);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.log('Database not available, using local storage');
    }

    // Fallback to localStorage + defaults
    const storedLanguages = localStorage.getItem('comax_languages');
    if (storedLanguages) {
      const parsed = JSON.parse(storedLanguages);
      setLanguages(parsed);
      setFilteredLanguages(parsed);
    } else {
      setLanguages(DEFAULT_LANGUAGES);
      setFilteredLanguages(DEFAULT_LANGUAGES);
      localStorage.setItem('comax_languages', JSON.stringify(DEFAULT_LANGUAGES));
    }
    setIsLoading(false);
  };

  const handleAddLanguage = async () => {
    if (!selectedLanguageToAdd) {
      toast.error('יש לבחור שפה');
      return;
    }

    const languageToAdd = AVAILABLE_LANGUAGES.find((l) => l.code === selectedLanguageToAdd);
    if (!languageToAdd) return;

    // Check if already exists
    if (languages.some((l) => l.code === languageToAdd.code)) {
      toast.error('שפה זו כבר קיימת במערכת');
      return;
    }

    const newLanguage: Language = {
      ...languageToAdd,
      is_active: true,
    };

    if (useDatabase) {
      try {
        const { data, error } = await supabase
          .from('languages')
          .insert(newLanguage)
          .select()
          .single();

        if (error) throw error;

        setLanguages([...languages, data]);
        toast.success(`שפה ${languageToAdd.name} נוספה בהצלחה`);
      } catch (err) {
        toast.error('שגיאה בהוספת השפה');
        console.error(err);
      }
    } else {
      const updatedLanguages = [...languages, newLanguage];
      setLanguages(updatedLanguages);
      localStorage.setItem('comax_languages', JSON.stringify(updatedLanguages));
      toast.success(`שפה ${languageToAdd.name} נוספה בהצלחה`);
    }

    setIsDialogOpen(false);
    setSelectedLanguageToAdd('');
  };

  const handleToggleActive = async (language: Language) => {
    const updatedLanguage = { ...language, is_active: !language.is_active };

    if (useDatabase && language.id) {
      try {
        const { error } = await supabase
          .from('languages')
          .update({ is_active: updatedLanguage.is_active })
          .eq('id', language.id);

        if (error) throw error;
      } catch (err) {
        toast.error('שגיאה בעדכון השפה');
        return;
      }
    }

    const updatedLanguages = languages.map((l) =>
      l.code === language.code ? updatedLanguage : l
    );
    setLanguages(updatedLanguages);

    if (!useDatabase) {
      localStorage.setItem('comax_languages', JSON.stringify(updatedLanguages));
    }

    toast.success(
      updatedLanguage.is_active
        ? `שפה ${language.name} הופעלה`
        : `שפה ${language.name} הושבתה`
    );
  };

  const handleDeleteLanguage = async (language: Language) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את השפה ${language.name}?`)) {
      return;
    }

    if (useDatabase && language.id) {
      try {
        const { error } = await supabase
          .from('languages')
          .delete()
          .eq('id', language.id);

        if (error) throw error;
      } catch (err) {
        toast.error('שגיאה במחיקת השפה');
        return;
      }
    }

    const updatedLanguages = languages.filter((l) => l.code !== language.code);
    setLanguages(updatedLanguages);

    if (!useDatabase) {
      localStorage.setItem('comax_languages', JSON.stringify(updatedLanguages));
    }

    toast.success(`שפה ${language.name} נמחקה`);
  };

  const handleTranslateLanguage = async (language: Language) => {
    // Don't translate Hebrew (source language)
    if (language.code === 'he-IL') {
      toast.error('לא ניתן לתרגם לעברית - זו שפת המקור');
      return;
    }

    if (!confirm(`האם לתרגם את כל התוכן לשפה ${language.name} (${language.native_name})? פעולה זו תתרגם מעברית לשפה זו.`)) {
      return;
    }

    setTranslatingLanguage(language.code);
    setTranslationProgress(0);
    toast.info(`מתחיל תרגום ל${language.native_name}...`);

    try {
      const result = await translateAllHebrewToLanguagesWithProgress(
        [language.code as 'en-US' | 'ro-RO' | 'th-TH' | 'ar-SA'],
        (progress) => {
          setTranslationProgress(progress);
        }
      );

      if (result.success) {
        toast.success(`תרגום ל${language.native_name} הושלם! תורגמו ${result.translated} פריטים`);
      } else {
        toast.warning(`תרגום הושלם עם שגיאות: ${result.translated} תורגמו, ${result.errors} שגיאות`);
        if (result.errorMessages.length > 0) {
          console.error('Translation errors:', result.errorMessages);
        }
      }
    } catch (error) {
      toast.error(`שגיאה בתרגום ל${language.native_name}`);
      console.error('Translation error:', error);
    } finally {
      setTranslatingLanguage(null);
      setTranslationProgress(0);
    }
  };

  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    (al) => !languages.some((l) => l.code === al.code)
  );

  return (
    <AppLayout title="שפות" description="הוספה וניהול שפות נתמכות במערכת">
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>שפות במערכת</CardTitle>
                <CardDescription>
                  {languages.length} שפות מוגדרות ({languages.filter((l) => l.is_active).length} פעילות)
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    הוסף שפה
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>הוספת שפה חדשה</DialogTitle>
                    <DialogDescription>
                      בחר שפה מהרשימה להוספה למערכת
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>בחר שפה</Label>
                      <Select
                        value={selectedLanguageToAdd}
                        onValueChange={setSelectedLanguageToAdd}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר שפה..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableToAdd.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.native_name} - {lang.name} ({lang.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button onClick={handleAddLanguage}>הוסף</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש שפה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Languages Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] text-right">קוד</TableHead>
                    <TableHead className="w-[120px] text-right">שם</TableHead>
                    <TableHead className="w-[120px] text-right">שם מקומי</TableHead>
                    <TableHead className="w-[120px] text-right">כיוון</TableHead>
                    <TableHead className="w-[80px] text-center">סטטוס</TableHead>
                    <TableHead className="w-[120px] text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLanguages.map((language) => (
                    <TableRow key={language.code}>
                      <TableCell className="font-mono text-right">{language.code}</TableCell>
                      <TableCell className="text-right">{language.name}</TableCell>
                      <TableCell className="text-right">{language.native_name}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            language.direction === 'rtl'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {language.direction === 'rtl' ? 'ימין לשמאל' : 'שמאל לימין'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={language.is_active}
                          onCheckedChange={() => handleToggleActive(language)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {translatingLanguage === language.code ? (
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${translationProgress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-primary min-w-[32px]">
                                {translationProgress}%
                              </span>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTranslateLanguage(language)}
                              disabled={translatingLanguage !== null || language.code === 'he-IL'}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              title={language.code === 'he-IL' ? 'שפת מקור' : `תרגם ל${language.native_name}`}
                            >
                              <Wand2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLanguage(language)}
                            disabled={translatingLanguage !== null}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </AppLayout>
  );
}
